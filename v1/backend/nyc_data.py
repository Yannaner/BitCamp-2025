import numpy as np

NYC_DISTRICTS = {
    'manhattan': {
        'density_range': (0.7, 0.9),
        'type': 'business',
        'stations': [(0,0), (0,1), (1,0), (1,1)]
    },
    'brooklyn': {
        'density_range': (0.5, 0.7),
        'type': 'mixed',
        'stations': [(2,0), (2,1), (3,0)]
    },
    'queens': {
        'density_range': (0.4, 0.6),
        'type': 'residential',
        'stations': [(0,2), (0,3), (1,2)]
    },
    'bronx': {
        'density_range': (0.3, 0.5),
        'type': 'residential',
        'stations': [(2,2), (2,3)]
    },
    'staten_island': {
        'density_range': (0.2, 0.4),
        'type': 'residential',
        'stations': [(1,3), (3,1), (3,2), (3,3)]
    }
}

def generate_nyc_population_density(grid_size=4):
    density_map = np.zeros((grid_size, grid_size))
    
    for district, data in NYC_DISTRICTS.items():
        min_density, max_density = data['density_range']
        for x, y in data['stations']:
            density_map[x][y] = np.random.uniform(min_density, max_density)
            
    return density_map
