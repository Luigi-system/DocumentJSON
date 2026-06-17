import React from 'react';
import Login from './components/Login';

interface LoginPageProps {
    onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    return <Login onLogin={onLogin} />;
};

export default LoginPage;
