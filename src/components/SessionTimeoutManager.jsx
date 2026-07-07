import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@apollo/client';
import { logout, loginSuccess } from '../store/slices/authSlice';
import { showToast } from '../store/slices/uiSlice';
import { REFRESH_TOKEN_MUTATION } from '../graphql/operations';

// Helper to decode JWT token payload in pure JavaScript
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export default function SessionTimeoutManager() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [refreshSession] = useMutation(REFRESH_TOKEN_MUTATION);
  
  const isRefreshing = useRef(false);
  const lastActiveTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initialize/sync last active time on mount
    const saved = localStorage.getItem('lastActiveTime');
    if (saved) {
      lastActiveTimeRef.current = parseInt(saved, 10);
    } else {
      localStorage.setItem('lastActiveTime', Date.now().toString());
    }

    // Handler to capture user activity
    const updateActivity = () => {
      const now = Date.now();
      // Throttle localStorage updates to every 10 seconds to optimize performance
      if (now - lastActiveTimeRef.current > 10000) {
        localStorage.setItem('lastActiveTime', now.toString());
      }
      lastActiveTimeRef.current = now;
    };

    // Listen to standard interaction events
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, updateActivity, { passive: true }));

    // Periodic check every 10 seconds
    const interval = setInterval(async () => {
      const now = Date.now();
      
      // Read directly from localStorage to handle multi-tab synchronization
      const currentToken = localStorage.getItem('token');
      const currentRefreshToken = localStorage.getItem('refreshToken');

      if (!currentToken || !currentRefreshToken) {
        // If tokens are deleted (e.g. from logout in another tab), logout locally
        dispatch(logout());
        return;
      }

      // Sync active time from localStorage if updated by another tab
      const savedActive = localStorage.getItem('lastActiveTime');
      if (savedActive) {
        const savedTime = parseInt(savedActive, 10);
        if (savedTime > lastActiveTimeRef.current) {
          lastActiveTimeRef.current = savedTime;
        }
      }

      // 1. Idle logout check (12 hours for Super Admin, 20 minutes for others)
      const idleTime = now - lastActiveTimeRef.current;
      const isSuperAdmin = user?.role === 'SUPER_ADMIN';
      const idleLimit = isSuperAdmin ? 12 * 60 * 60 * 1000 : 20 * 60 * 1000;
      if (idleTime > idleLimit) {
        console.log(`SessionTimeoutManager: Idle limit reached (${isSuperAdmin ? '12 hours' : '20 minutes'}). Logging out...`);
        dispatch(logout());
        dispatch(showToast({ message: 'You have been logged out due to inactivity.', severity: 'warning' }));
        return;
      }

      // 2. Token expiration and refresh check
      const decoded = decodeToken(currentToken);
      if (!decoded || !decoded.exp) {
        dispatch(logout());
        return;
      }

      const expiresAt = decoded.exp * 1000;
      const timeLeft = expiresAt - now;

      // If token expires soon and we aren't already refreshing
      // 30 minutes threshold for Super Admin, 5 minutes for others
      const refreshThreshold = isSuperAdmin ? 30 * 60 * 1000 : 5 * 60 * 1000;
      if (timeLeft < refreshThreshold && !isRefreshing.current) {
        isRefreshing.current = true;
        console.log('SessionTimeoutManager: Access token expiring soon. Requesting refresh...');
        try {
          const { data } = await refreshSession({
            variables: { refreshToken: currentRefreshToken }
          });
          if (data && data.refreshToken) {
            dispatch(loginSuccess(data.refreshToken));
            console.log('SessionTimeoutManager: Access token refreshed successfully.');
          } else {
            throw new Error('Empty refresh response');
          }
        } catch (error) {
          console.error('SessionTimeoutManager: Token refresh failed:', error);
          dispatch(logout());
          dispatch(showToast({ message: 'Session expired. Please log in again.', severity: 'warning' }));
        } finally {
          isRefreshing.current = false;
        }
      }
    }, 10000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, updateActivity));
      clearInterval(interval);
    };
  }, [isAuthenticated, dispatch, refreshSession]);

  return null;
}
