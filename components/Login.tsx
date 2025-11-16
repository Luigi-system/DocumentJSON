import React from 'react';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    return (
        <div className="min-h-screen bg-main flex items-center justify-center p-4 overflow-hidden relative theme-night">
            {/* Animated background */}
            <div className="absolute top-0 left-0 w-full h-full z-0" id="space-bg">
                <div className="planet" style={{'--size': '80px', '--x': '15%', '--y': '20%', '--duration': '45s', '--color': 'var(--indigo-600)', '--hover-dx': '10px', '--hover-dy': '0px'} as React.CSSProperties}></div>
                <div className="planet" style={{'--size': '50px', '--x': '80%', '--y': '70%', '--duration': '60s', '--color': 'var(--indigo-500)', '--hover-dx': '-8px', '--hover-dy': '8px'} as React.CSSProperties}></div>
                <div className="planet" style={{'--size': '30px', '--x': '75%', '--y': '15%', '--duration': '30s', '--color': 'var(--indigo-400)', '--hover-dx': '5px', '--hover-dy': '5px'} as React.CSSProperties}></div>
                <div className="comet"></div>
                <div className="comet" style={{'animationDelay': '5s', 'animationDuration': '10s', '--x-start': '120vw', '--y-start': '-20vh'} as React.CSSProperties}></div>
                <div className="comet" style={{'animationDelay': '12s', 'animationDuration': '8s', '--x-start': '50vw', '--y-start': '-20vh'} as React.CSSProperties}></div>
                <div id="stars"></div> {/* Added stars background */}
            </div>

            <div className="w-full max-w-md p-8 space-y-6 bg-panel/80 backdrop-blur-sm border border-main rounded-2xl shadow-2xl text-center z-10 animate-fade-in">
                <div className="flex justify-center">
                    <img src="https://api.iconify.design/logos:google-gemini.svg" alt="Logo" className="h-20 w-20" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-main">Bienvenido de nuevo</h1>
                    <p className="text-subtle mt-2">
                        Crea Documentos Dinámicos, sin Esfuerzo.
                    </p>
                </div>

                <form className="space-y-4 text-left" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-subtle">Correo Electrónico</label>
                        <input
                            id="email"
                            type="email"
                            defaultValue="demo@gemini-docs.com"
                            className="mt-1 block w-full px-4 py-2 bg-tertiary border border-main rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                            placeholder="tucorreo@ejemplo.com"
                        />
                    </div>
                     <div>
                        <label htmlFor="password"className="text-sm font-medium text-subtle">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            defaultValue="demopassword"
                            className="mt-1 block w-full px-4 py-2 bg-tertiary border border-main rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                </form>
                
                <button
                    onClick={onLogin}
                    className="w-full px-4 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-panel transition-transform transform hover:scale-105"
                >
                    Iniciar Sesión
                </button>
                 <p className="text-xs text-subtle">
                    Para fines de demostración, cualquier credencial funcionará.
                </p>
            </div>
        </div>
    );
};

export default Login;