import logging

def calculate_transport_after_overtime(employee, transport_config):
    logger = logging.getLogger(__name__)
    needs_transport = employee.get('overtime', {}).get('needsTransport', False)
    km_travelled = employee.get('kmTravelled', 0)
    
    transport_pay = 0.0
    
    if needs_transport and km_travelled > 0:
        # Assuming transport rate is defined in transport_config
        transport_rate = transport_config.get("transportAfterOvertimeRate", 0.59)  # Default rate
        transport_pay = km_travelled * transport_rate
        logger.info(f"Calculated transport pay: {transport_pay} for KM travelled: {km_travelled}")
    
    return transport_pay
