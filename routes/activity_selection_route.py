@activity_selection_bp.route('/position/')
@activity_selection_bp.route('/position_creation')
def position_creation():
    try:
        print("\n=== Starting Position Creation Route ===")
        print(f"Current working directory: {os.getcwd()}")
        
        # Load employment types
        print("\nLoading employment_types.json...")
        try:
            with open('data/employment_types.json', 'r') as f:
                employment_types = json.load(f)
                print(f"Loaded employment types: {len(employment_types.get('options', []))} options")
                print(f"Employment types structure: {list(employment_types.keys())}")
        except Exception as e:
            print(f"Error loading employment_types.json: {str(e)}")
            raise
            
        # Load position creation config
        print("\nLoading position_creation_config.json...")
        try:
            with open('data/position_creation_config.json', 'r') as f:
                config = json.load(f)
                print("Loaded position creation config")
                print(f"Config structure: {list(config.keys())}")
                print(f"Sections available: {list(config.get('sections', {}).keys())}")
        except Exception as e:
            print(f"Error loading position_creation_config.json: {str(e)}")
            raise
            
        # Extract streams data from config
        print("\nExtracting streams data...")
        try:
            streams = config['sections']['streams']
            print(f"Streams data structure: {list(streams.keys())}")
            print(f"Number of stream options: {len(streams.get('options', []))}")
        except Exception as e:
            print(f"Error extracting streams data: {str(e)}")
            raise
            
        print("\nData validation:")
        print(f"- employment_types: {bool(employment_types)}")
        print(f"- streams: {bool(streams)}")
        print(f"- config: {bool(config)}")
        print(f"- streams.title: {streams.get('title', 'NOT FOUND')}")
        print(f"- streams.emoji: {streams.get('emoji', 'NOT FOUND')}")
        print(f"- streams.options: {len(streams.get('options', []))} items")
            
        return render_template('position_creation.html', 
                             employment_types=employment_types,
                             streams=streams,
                             config=config)
    except Exception as e:
        print(f"\nERROR in position_creation route: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return render_template('error.html', error=str(e)) 