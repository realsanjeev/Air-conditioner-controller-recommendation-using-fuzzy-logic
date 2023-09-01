import argparse
import configparser
import io
import os
import pathlib
import sysconfig

import pkg_resources

parser = argparse.ArgumentParser()
parser.add_argument('package')
args = parser.parse_args()

virtualenv = pathlib.Path(os.environ['VIRTUAL_ENV'])

dist = pkg_resources.get_distribution(args.package)
files = set()

site_packages = pathlib.Path(sysconfig.get_path('purelib'))

egg_link = site_packages.joinpath(f'{dist.project_name}.egg-link')
if egg_link.exists():
    files.add(egg_link)

for name in ('RECORD', 'installed-files.txt'):
    if dist.has_metadata(name):
        files.update(
            pathlib.Path(dist.location,
                         line.split(',')[0]).resolve()
            for line in dist.get_metadata_lines(name))

if dist.has_metadata('entry_points.txt'):
    parser = configparser.ConfigParser()
    parser.read_file(
        io.StringIO('\n'.join(dist.get_metadata_lines('entry_points.txt'))))
    if parser.has_section('console_scripts'):
        for name, _ in parser.items('console_scripts'):
            files.add(virtualenv.joinpath('bin', name))

for f in files:
    print(f)
