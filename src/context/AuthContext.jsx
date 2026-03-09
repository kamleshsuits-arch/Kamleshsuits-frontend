import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  CognitoUser, 
  AuthenticationDetails, 
  CognitoUserAttribute 
} from 'amazon-cognito-identity-js';
import { userPool } from '../lib/aws-config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.getSession((err, session) => {
          if (err || !session.isValid()) {
            setUser(null);
            setLoading(false);
            return;
          }
          
          const payload = session.getIdToken().payload;
          setUser({
            id: payload.sub,
            email: payload.email,
            name: payload.name || payload['custom:full_name'] || payload.email,
            groups: payload['cognito:groups'] || [],
            token: session.getIdToken().getJwtToken(),
            authTime: payload.auth_time * 1000
          });
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signup = (email, password, metadata) => {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'name', Value: metadata.full_name || '' }),
        new CognitoUserAttribute({ Name: 'phone_number', Value: metadata.phone_number || '' }),
      ];

      userPool.signUp(email, password, attributeList, null, (err, result) => {
        if (err) return reject(err);
        resolve(result.user);
      });
    });
  };

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (result) => {
          const payload = result.getIdToken().payload;
          const userObj = {
            id: payload.sub,
            email: payload.email,
            name: payload.name || payload.email,
            groups: payload['cognito:groups'] || [],
            token: result.getIdToken().getJwtToken(),
            authTime: payload.auth_time * 1000
          };
          setUser(userObj);
          resolve(userObj);
        },
        onFailure: (err) => reject(err),
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          // Filter out attributes that are system-managed or read-only
          const challengeAttributes = { ...userAttributes };
          delete challengeAttributes.email_verified;
          delete challengeAttributes.email;
          delete challengeAttributes.sub;
          delete challengeAttributes.phone_number_verified;

          // If 'name' is required but missing
          if (!challengeAttributes.name) {
            challengeAttributes.name = email.split('@')[0];
          }

          // If 'phone_number' is required but missing, use a placeholder
          if (!challengeAttributes.phone_number) {
            challengeAttributes.phone_number = '+919992304505';
          }

          cognitoUser.completeNewPasswordChallenge(password, challengeAttributes, {
            onSuccess: (result) => {
              const payload = result.getIdToken().payload;
              const userObj = {
                id: payload.sub,
                email: payload.email,
                name: payload.name || payload.email,
                groups: payload['cognito:groups'] || [],
                token: result.getIdToken().getJwtToken(),
                authTime: payload.auth_time * 1000
              };
              setUser(userObj);
              resolve(userObj);
            },
            onFailure: (err) => {
              console.error("Cognito Challenge Failure:", err);
              reject(err);
            },
          });
        }
      });
    });
  };

  const logout = () => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
      setUser(null);
    }
  };

  const verifyEmail = (email, code) => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  };

  const resendVerificationCode = (email) => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  };

  const forgotPassword = (email) => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.forgotPassword({
        onSuccess: (data) => resolve(data),
        onFailure: (err) => reject(err),
      });
    });
  };

  const resetPassword = (email, code, newPassword) => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      });
    });
  };

  const value = {
    user,
    isAdmin: user?.groups?.includes('Admin') || user?.email === 'sanjayrathi575@gmail.com',
    loading,
    signup,
    login,
    logout,
    verifyEmail,
    resendVerificationCode,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
