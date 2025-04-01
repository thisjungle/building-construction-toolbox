# helpers/getBasePay.py

def get_base_pay(employee, traineeships, school_based_apprentices):
    """
    Determines the base pay for an employee based on classification, level,
    traineeship, or school-based apprenticeship.
    """
    classification = employee.get('classification')
    level = employee.get('level')
    traineeship = employee.get('traineeship')
    school_based_apprentice = employee.get('schoolBasedApprentice')
    
    # Handle Traineeships
    if traineeship:
        sector = traineeships['traineeships']['nationalTrainingWage'].get(traineeship['sector'], traineeships['traineeships'].get('default'))
        if not sector:
            raise Exception(f"Invalid traineeship sector: {traineeship['sector']}")
        
        base_pay = 0
        
        if traineeship['type'] == "fullTime":
            stage_key = f"Stage_{traineeship['stage']}"
            base_pay = sector['fullTime']['weeklyRates'].get(stage_key)
            if not base_pay:
                raise Exception(f"Invalid traineeship stage: {traineeship['stage']}")
        
        elif traineeship['type'] == "otherTraineeships":
            sub_sector = sector['otherTraineeships'].get(traineeship['subSector'], sector['otherTraineeships'].get('defaultSector'))
            if not sub_sector:
                raise Exception(f"Invalid traineeship sub-sector: {traineeship['subSector']}")
            base_pay = sub_sector['weeklyRates'].get(traineeship['wageLevel'])
            if not base_pay:
                raise Exception(f"Invalid traineeship wage level: {traineeship['wageLevel']}")
        
        else:
            raise Exception(f"Invalid traineeship type: {traineeship['type']}")
        
        # Apply AQF Certificate Level IV increase if applicable
        if traineeship.get('aqfLevel') == 4:
            percentage_increase = sector['aqfCertificateLevelIV']['percentageIncrease']
            base_pay *= (1 + percentage_increase / 100)
        
        return base_pay
    
    # Handle School-based Apprenticeships
    if school_based_apprentice:
        year_of_schooling = school_based_apprentice.get('yearOfSchooling')
        training_type = school_based_apprentice.get('trainingType')
        wage_level = school_based_apprentice.get('wageLevel')
        hours_worked = employee.get('hoursWorked', 0)
        
        rates = school_based_apprentices['schoolBasedApprentices']['minimumHourlyRates']['schoolBased']
        if year_of_schooling <= 11:
            hourly_rate = school_based_apprentices['schoolBasedApprentices']['minimumHourlyRates']['schoolBased']['year11OrLower']
        elif year_of_schooling == 12:
            hourly_rate = school_based_apprentices['schoolBasedApprentices']['minimumHourlyRates']['schoolBased']['year12']
        else:
            raise Exception(f"Invalid year of schooling: {year_of_schooling}")
        
        # Apply loadings based on training type
        loading = school_based_apprentices['schoolBasedApprentices']['additionalLoadings'].get(training_type)
        if loading is None:
            raise Exception(f"Invalid training type: {training_type}")
        hourly_rate *= loading
        
        base_pay = hourly_rate * hours_worked
        return base_pay
    
    # Handle Regular Employees
    base_pay_data = employee.get('basePay')
    if not base_pay_data:
        raise Exception("Base pay data is missing in employee data.")
    
    classification_data = base_pay_data.get(classification)
    if not classification_data:
        raise Exception(f"Invalid classification: {classification}")
    
    base_pay = classification_data.get(level)
    if not base_pay:
        raise Exception(f"Invalid level: {level} for classification: {classification}")
    
    return base_pay
