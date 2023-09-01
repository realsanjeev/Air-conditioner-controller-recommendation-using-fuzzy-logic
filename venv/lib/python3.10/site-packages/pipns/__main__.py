import argparse
import concurrent.futures
import json
import os
import pathlib
import signal
import subprocess

import pkg_resources

_version = pkg_resources.get_distribution(__package__).version

# fix a deficiency in pipenv
# https://github.com/pypa/pipenv/issues/1798
os.environ['PIP_USER'] = '0'

os.environ.pop('VIRTUAL_ENV', None)
os.environ['PIPENV_IGNORE_VIRTUALENVS'] = '1'

os.environ.setdefault(
    'PIPNS_ROOT',
    os.environ.get('XDG_DATA_HOME', '~/.local/share/pipns')
)

PIPNS_ROOT = pathlib.Path(os.environ['PIPNS_ROOT']).expanduser().resolve()
PIPNS_ENVIRONMENTS = PIPNS_ROOT.joinpath('environments')
PIPNS_BIN = PIPNS_ROOT.joinpath('bin')
PIPNS_MAN = PIPNS_ROOT.joinpath('share', 'man')
PIPNS_SHELL = PIPNS_ROOT.joinpath('shell.sh')


def _force_link(target, source):
    try:
        target.unlink()
    except FileNotFoundError:
        pass
    target.parent.mkdir(parents=True, exist_ok=True)
    target.symlink_to(source)


def link_package_files(package):
    pipns_root = pathlib.Path(os.environ['PIPENV_PIPFILE']).parent

    for path in pipns_files(package):
        relative_path = path.relative_to(pipns_root.joinpath('.venv'))

        target = pipns_root.joinpath(relative_path)
        _force_link(target, path)

        if pathlib.Path('bin') in relative_path.parents:
            _force_link(
                PIPNS_BIN.joinpath(
                    relative_path.relative_to(pathlib.Path('bin'))), path)

        if pathlib.Path('share', 'man') in relative_path.parents:
            _force_link(
                PIPNS_MAN.joinpath(
                    relative_path.relative_to(pathlib.Path('share', 'man'))),
                path)


def pipns_files(package):
    result = subprocess.run(
        ['pipenv', 'run', 'python',
         pkg_resources.resource_filename('pipns', 'scripts/package_files.py'),
         package],
        check=True,
        stdout=subprocess.PIPE)
    return [
        pathlib.Path(line.strip())
        for line in result.stdout.decode().split('\n') if line
    ]


def pipenv_explicitly_installed():
    result = subprocess.run(['pipns', 'graph', '--json-tree'],
                            stdout=subprocess.PIPE)
    return [package['package_name'] for package in json.loads(result.stdout)]


def pipns_list():
    paths = []
    if PIPNS_ENVIRONMENTS.exists():
        paths.extend([env_path for env_path in PIPNS_ENVIRONMENTS.iterdir()])
    return sorted(paths)


def pipns_all(args, max_workers=None):
    with concurrent.futures.ProcessPoolExecutor() as executor:
        futures = [
            executor.submit(
                subprocess.run, ['pipns', '-n', path.name, *args], check=True)
            for path in pipns_list()
        ]
        for future in concurrent.futures.as_completed(futures):
            future.result()


def write_shell_integration():
    PIPNS_SHELL.write_text('\n'.join([
        'export PATH="{}:$PATH"'.format(PIPNS_BIN),
        'export MANPATH="{}:$MANPATH"'.format(PIPNS_MAN)
    ]))


def main():
    parser = argparse.ArgumentParser(__package__)
    parser.add_argument('--version', action='version', version=_version)

    namespace_group = parser.add_mutually_exclusive_group(
        required=False if os.environ.get('PIPENV_PIPFILE') else True
    )
    namespace_group.add_argument('--list', action='store_true')
    namespace_group.add_argument('--all', action='store_true')
    namespace_group.add_argument('-n', dest='namespace')
    parser.add_argument(
        'pipenv', nargs=argparse.REMAINDER, help='execute pipenv commands'
    )
    parser.add_argument(
        '--num-processes', type=int,
        help='number of processes to use with --all (default num vcpus)'
    )
    args = parser.parse_args()

    PIPNS_ROOT.mkdir(parents=True, exist_ok=True)

    write_shell_integration()

    if args.list:
        for path in pipns_list():
            print(path.name)
        parser.exit()
    elif args.all:
        pipns_all(args.pipenv, args.num_processes)
        parser.exit()
    elif 'PIPENV_PIPFILE' in os.environ:
        namespace_pipfile = pathlib.Path(
            os.environ['PIPENV_PIPFILE']).expanduser().resolve()
    elif args.namespace:
        namespace_dir = PIPNS_ENVIRONMENTS.joinpath(args.namespace)
        if not namespace_dir.exists():
            namespace_dir.mkdir(parents=True, exist_ok=True)
        namespace_pipfile = pathlib.Path(namespace_dir, 'Pipfile')
        os.environ['PIPENV_PIPFILE'] = str(namespace_pipfile)

    namespace_pipfile.parent.mkdir(parents=True, exist_ok=True)
    # The file could alternatively be touched, but then pipenv would
    # set the python_version to active version. That's not appropriate
    # for pipns so let's be generic unless specified otherwise.
    if not namespace_pipfile.is_file():
        namespace_pipfile.write_text('[requires]\npython_version = "*"')

    namespace_pipfile.touch()

    os.environ['PIPENV_VENV_IN_PROJECT'] = '1'

    signal.signal(signal.SIGINT, signal.SIG_IGN)
    result = subprocess.run(['pipenv', *args.pipenv])
    signal.signal(signal.SIGINT, signal.SIG_DFL)

    if result.returncode != 0:
        parser.exit(result.returncode)
    if args.pipenv and args.pipenv[0] in ('install', 'update'):
        for package in pipenv_explicitly_installed():
            link_package_files(package)


if __name__ == '__main__':
    main()
