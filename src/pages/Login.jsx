import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import '../index.css';

const Login = () => {
    return (
        <div className="flex items-center justify-center h-screen" style={{ background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}>
            <SignIn />
        </div>
    );
};

export default Login;
