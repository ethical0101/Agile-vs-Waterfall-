import React, { useEffect, useState } from 'react';
import { auth } from '../../lib/firebase';

export const FirebaseTest: React.FC = () => {
  const [configStatus, setConfigStatus] = useState<string>('Loading...');

  useEffect(() => {
    try {
      console.log('Firebase app config:', auth.app.options);

      if (auth.app.options.apiKey) {
        setConfigStatus('Firebase is properly configured');
      } else {
        setConfigStatus('Firebase configuration is missing API key');
      }
    } catch (error) {
      console.error('Firebase configuration error:', error);
      setConfigStatus(`Firebase error: ${error}`);
    }
  }, []);

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
      <h3 className="font-bold">Firebase Configuration Status:</h3>
      <p>{configStatus}</p>
    </div>
  );
};
