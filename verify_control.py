import control
import sys

def test_control():
    print("Testing control logic...")
    
    # Test cases
    # (temp, humidity) -> expected_action (rough guess based on logic)
    # We mainly want to check if it crashes and if the output string is correct
    
    test_cases = [
        (10, 20), # Cold, Low humidity -> Warm up?
        (25, 50), # Optimal -> No change?
        (35, 80), # Hot, High humidity -> Cool Down?
    ]

    for t, h in test_cases:
        try:
            action, val = control.generate_output(t, h)
            print(f"Input: Temp={t}, Hum={h} -> Output: {action}, Value={val}")
            
            if action not in ['Warm up', 'No change', 'Cool Down']:
                print(f"ERROR: Unexpected action '{action}'")
                sys.exit(1)
                
        except Exception as e:
            print(f"ERROR: {e}")
            sys.exit(1)

    print("Verification successful!")

if __name__ == "__main__":
    test_control()
