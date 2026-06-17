import React from 'react';
import Dashboard from './components/Dashboard';

type PlantillasPageProps = React.ComponentProps<typeof Dashboard>;

const PlantillasPage: React.FC<PlantillasPageProps> = (props) => {
    return <Dashboard {...props} />;
};

export default PlantillasPage;
