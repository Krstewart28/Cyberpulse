// Local app parameters retained only for compatibility with the existing UI.
export const appParams = {
  appId: 'cyberpulse-local',
  token: typeof window !== 'undefined' ? window.localStorage.getItem('cyberpulse_session') : null,
  functionsVersion: 'local',
  appBaseUrl: typeof window !== 'undefined' ? window.location.origin : ''
};
