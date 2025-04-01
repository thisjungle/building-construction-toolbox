import json
import os
import logging

def load_json(file_name):
    """
    Load a JSON file from the config directory.

    Parameters:
        file_name (str): The name of the JSON file to load.

    Returns:
        dict: The loaded JSON data.
    """
    file_path = os.path.join('config', file_name)
    logger = logging.getLogger(__name__)
    logger.info(f"Attempting to load JSON file from: {file_path}")
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
        logger.info(f"Successfully loaded {file_name}")
        return data
    except FileNotFoundError:
        logger.error(f"Configuration file {file_name} not found.")
        raise Exception(f"Configuration file {file_name} not found.")
    except json.JSONDecodeError:
        logger.error(f"Configuration file {file_name} contains invalid JSON.")
        raise Exception(f"Configuration file {file_name} contains invalid JSON.")

def get_base_pay(classification, level, base_pay_config):
    """
    Retrieve the weekly and hourly base pay for a given classification and level.

    Parameters:
        classification (str): The classification of the employee (e.g., 'fullTime').
        level (str): The level of the employee (e.g., '3').
        base_pay_config (dict): The base pay configuration loaded from basePay.json.

    Returns:
        tuple: A tuple containing (weekly_pay, hourly_pay).

    Raises:
        KeyError: If the classification and level combination is not found.
    """
    logger = logging.getLogger(__name__)
    key = f"Level_{level}_{classification}"
    print(f"Looking for base pay key: '{key}'")
    available_keys = list(base_pay_config.get("basePay", {}).keys())
    print("Available base pay keys:", available_keys)
    base_pay = base_pay_config.get("basePay", {}).get(key, {})
    if not base_pay:
        logger.error(f"Base pay not found for classification: {classification}, level: {level}")
        raise KeyError(f"Base pay not found for classification: {classification}, level: {level}")
    weekly_pay = base_pay.get("weekly")
    hourly_pay = base_pay.get("hourly")
    logger.info(f"Retrieved base pay for {key}: Weekly=${weekly_pay}, Hourly=${hourly_pay}")
    return weekly_pay, hourly_pay
