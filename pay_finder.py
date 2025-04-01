import json

# Load JSON files
with open("data/classifications.json", "r") as f:
    classifications_data = json.load(f)

with open("data/minimum_rates.json", "r") as f:
    minimum_rates = json.load(f)

with open("data/work_categories_and_allowances.json", "r") as f:
    work_data = json.load(f)


def ask_question(prompt, options):
    """Ask a question dynamically from JSON data (handles both lists and dictionaries)."""
    print(prompt)
    if isinstance(options, dict):  # Handle dictionary input
        items = options.items()
        options_list = []
        for idx, (key, details) in enumerate(items, start=1):
            options_list.append(key)
            description = details.get('description', 'No description available.')
            print(f"{idx}. {key.replace('_', ' ').title()} - {description}")
    elif isinstance(options, list):  # Handle list input
        options_list = options
        for idx, option in enumerate(options_list, start=1):
            print(f"{idx}. {option}")
    else:
        raise TypeError("Options should be either a dictionary or a list.")

    while True:
        try:
            choice = int(input("Select an option (by number): "))
            if 1 <= choice <= len(options_list):
                return options_list[choice - 1]
        except ValueError:
            print("Invalid choice. Please try again.")


def get_stream_roles(stream, broadband_data, level):
    """Helper function to get roles for a specific stream and level."""
    level_key = f"Level_{level.split()[1]}"  # Converts "CW/ECW 3" to "Level_3"
    
    if stream == "general_building_and_construction":
        return broadband_data["Broadbanded_Classifications"]["General Construction"].get(level_key, [])
    elif stream == "civil_construction":
        return broadband_data["Broadbanded_Classifications"]["Civil Construction"].get(level_key, [])
    elif "engineering_construction" in stream:
        # Handle engineering sub-streams
        eng_stream = stream.split("_")[-1]  # Gets 'electrical', 'mechanical', or 'fabrication'
        return broadband_data["Broadbanded_Classifications"]["Engineering Construction"][eng_stream.title()].get(level_key, [])
    return []


def ask_classification_level():
    """Ask for classification level with hints from classifications.json."""
    # Load broadband data
    with open("broadband.json", "r") as f:
        broadband_data = json.load(f)
    
    levels = classifications_data["ScheduleA"]["Levels"]
    print("\nWhat is the employee's classification level?")
    
    current_stream = work_data.get("current_stream", "")
    
    for idx, level in enumerate(levels, start=1):
        print(f"\n{idx}. {level['Level']}")
        print(f"   Title: {level['Title']}")
        print(f"   Description: {level['Description']}")
        
        # Get roles specific to this level and stream
        stream_roles = get_stream_roles(current_stream, broadband_data, level["Level"])
        if stream_roles:
            print("   Typical Roles for your stream:")
            for role in stream_roles:
                print(f"   - {role}")
    
    while True:
        try:
            choice = int(input("\nSelect an option (by number): "))
            if 1 <= choice <= len(levels):
                return levels[choice - 1]["Level"]  # Return the selected level
        except ValueError:
            print("Invalid choice. Please try again.")


def calculate_casual_rate(base_rate):
    """Calculate casual hourly rate."""
    casual_loading = 0.25  # Casual workers get 25% loading
    return base_rate * (1 + casual_loading)


def get_multistorey_allowance():
    """Prompt for multistorey height range and calculate allowance."""
    height_ranges = work_data["work_categories"]["multistorey_building_construction"]["allowance"]["details"]
    print("\nSelect the height range of the building:")
    for idx, detail in enumerate(height_ranges, start=1):
        print(f"{idx}. {detail['floors']} - ${detail['rate']:.2f}/hour")
    while True:
        try:
            choice = int(input("\nSelect an option (by number): "))
            if 1 <= choice <= len(height_ranges):
                selected_rate = height_ranges[choice - 1]["rate"]
                return selected_rate * 38  # Weekly allowance for 38 hours
        except ValueError:
            print("Invalid choice. Please try again.")


def calculate_fixed_weekly_allowances():
    """Calculate fixed weekly allowances based on eligibility."""
    fixed_allowances = {
        "Air-Conditioning & Refrigeration Industry Allowance": 81.55,
        "Electrician's Licence Allowance": 33.03,
        "In Charge of Plant Allowance": 48.52,
        "Underground Allowance": 18.58,
        "Mobile Crane Capacity Adjustment": 24.78,
        "Lift Industry Allowance": 152.78
    }

    selected_allowances = {}

    print("\nDoes the employee qualify for any of the following allowances? (Select all that apply)")
    for idx, (allowance, rate) in enumerate(fixed_allowances.items(), start=1):
        print(f"{idx}. {allowance} - ${rate:.2f}/week")

    print("\nEnter the numbers corresponding to the allowances (e.g., 1,3,5):")
    selected_options = input("> ").split(",")

    try:
        for option in selected_options:
            option = int(option.strip())
            if 1 <= option <= len(fixed_allowances):
                allowance_name = list(fixed_allowances.keys())[option - 1]
                selected_allowances[allowance_name] = fixed_allowances[allowance_name]
    except ValueError:
        print("Invalid input. No allowances selected.")

    return selected_allowances


def calculate_additional_allowances():
    """Calculate additional allowances like tools, first aid, and fixed weekly allowances."""
    additional_items = {}

    # Tool Allowance Workflow
    if ask_question(
        "Does the employee qualify for a tool allowance? (yes/no)",
        ["yes", "no"]
    ).lower() == "yes":
        tool_categories = work_data["work_categories"]["additional_allowances"]["tools"]["categories"]
        print("\nSelect the category for tool allowance:")
        for idx, category in enumerate(tool_categories, start=1):
            print(f"{idx}. {category['name']} - ${category['allowance_amount']:.2f}/week")
            print("   Trades:", ", ".join(category["applicable_trades"]))
        while True:
            try:
                choice = int(input("\nSelect an option (by number): "))
                if 1 <= choice <= len(tool_categories):
                    selected_category = tool_categories[choice - 1]
                    additional_items[f"Tool Allowance ({selected_category['name']})"] = selected_category["allowance_amount"]
                    break
            except ValueError:
                print("Invalid choice. Please try again.")

    # Fixed Weekly Allowances Workflow (Moving this BEFORE first aid)
    fixed_allowances = calculate_fixed_weekly_allowances()
    additional_items.update(fixed_allowances)

    # First Aid Allowance Workflow
    if ask_question(
        "Does the employee hold a first aid qualification? (yes/no)",
        ["yes", "no"]
    ).lower() == "yes":
        first_aid = work_data["work_categories"]["additional_allowances"]["first_aid"]
        if first_aid:
            first_aid_rate = first_aid["rates"]["minimum"]
            additional_items["First Aid Allowance"] = first_aid_rate

    return additional_items

def calculate_pay(category, classification, is_casual):
    """Calculate the basic pay based on input data."""
    # Match classification with variations in the `minimum_rates` data
    if classification.startswith("CW/ECW 1"):
        classification_key = "CW/ECW 1 - Level a"  # Default to Level a
    else:
        classification_key = classification

    # Validate classification exists
    if classification_key not in minimum_rates["minimum_rates"]:
        print(f"Error: Classification '{classification}' not found in minimum rates data.")
        return {}

    # Calculate pay details
    min_rate = minimum_rates["minimum_rates"][classification_key]
    weekly_rate = min_rate["weekly_rate"]
    hourly_rate = min_rate["hourly_rate"]

    casual_loading = 0
    if is_casual:
        casual_loading = weekly_rate * 0.25
        weekly_rate += casual_loading

    # Base category allowance
    category_data = work_data["work_categories"].get(category, {})
    base_category_allowance = category_data.get("allowance", {}).get("amount", 0)

    # Multistorey adjustment (if applicable)
    multistorey_allowance = 0
    if category == "multistorey_building_construction":
        multistorey_allowance = get_multistorey_allowance()

    # Additional allowances (e.g., tools, first aid)
    additional_items = calculate_additional_allowances()
    additional_allowances = sum(additional_items.values())

    # Total weekly pay
    total_pay = weekly_rate + base_category_allowance + multistorey_allowance + additional_allowances
    return {
        "weekly_rate": weekly_rate,
        "casual_loading": casual_loading,
        "base_category_allowance": base_category_allowance,
        "multistorey_allowance": multistorey_allowance,
        "additional_allowances": additional_items,
        "total_weekly_pay": total_pay
    }

def main():
    # Step 1: Ask for the category of work and store the stream
    category = ask_question(
        "What category of work does the employee do?",
        work_data["work_categories"]
    )
    
    # Store the selected stream in work_data
    work_data["current_stream"] = category
    
    # Handle engineering sub-streams
    if category == "engineering_construction":
        eng_stream = ask_question(
            "Which engineering stream?",
            work_data["work_categories"]["engineering_construction"]
        )
        work_data["current_stream"] = f"engineering_construction_{eng_stream}"

    # Step 2: Ask for classification level
    classification = ask_classification_level()

    # Step 3: Ask if the employee is casual (UPDATED)
    print("\nIs the employee a casual worker?")
    print("1. Yes")
    print("2. No")
    while True:
        try:
            casual_choice = input("Enter your choice (1 or 2): ")
            if casual_choice in ["1", "2"]:
                is_casual = (casual_choice == "1")
                break
            print("Please enter either 1 or 2")
        except ValueError:
            print("Invalid input. Please enter 1 or 2")

    # Calculate pay
    pay_report = calculate_pay(category, classification, is_casual)

    # Generate detailed report
    print("\n--- Pay Report ---")
    print(f"Category: {category.replace('_', ' ').title()}")
    print(f"Classification Level: {classification}")
    print(f"Base Weekly Rate: ${pay_report['weekly_rate'] - pay_report['casual_loading']:.2f}")
    if is_casual:
        print(f"Casual Loading: ${pay_report['casual_loading']:.2f}")
    print(f"Category Allowance: ${pay_report['base_category_allowance']:.2f}")

    # Display Multistorey Allowance if applicable
    if pay_report["multistorey_allowance"] > 0:
        print(f"Multistorey Allowance: ${pay_report['multistorey_allowance']:.2f}")

    print("Additional Allowances:")
    for item, amount in pay_report["additional_allowances"].items():
        print(f"  - {item}: ${amount:.2f}")
    print(f"Total Weekly Pay: ${pay_report['total_weekly_pay']:.2f}")


if __name__ == "__main__":
    main()
