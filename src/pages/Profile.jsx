import React from 'react';
import { UserProfile } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';

const Profile = () => {
    return (
        <div className="flex-1 p-8 overflow-y-auto w-full flex justify-center">
            <UserProfile
                path="/profile"
                routing="path"
                appearance={{
                    baseTheme: dark,
                    variables: {
                        colorPrimary: '#3b82f6', // var(--accent-primary)
                        colorBackground: '#1e293b', // var(--bg-secondary)
                        colorText: '#f8fafc', // var(--text-primary)
                        colorTextSecondary: '#94a3b8', // var(--text-secondary)
                        fontFamily: 'Inter, system-ui, sans-serif'
                    },
                    elements: {
                        rootBox: {
                            width: '100%',
                            maxWidth: '1000px',
                            margin: '0 auto'
                        },
                        card: {
                            boxShadow: 'none',
                            border: '1px solid var(--border-color)'
                        }
                    }
                }}
            />
        </div>
    );
};

export default Profile;
