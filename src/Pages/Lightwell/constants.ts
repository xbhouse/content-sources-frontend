export const LIGHTWELL_FEATURE_NAME = 'lightwell-network';
export const lightwellPerPageKey = 'lightwellRepositoriesPerPage';
export const LIGHTWELL_USE_MOCK_DATA_KEY = 'lightwell-use-mock-data';
export const isLightwellMockDataEnabled = () =>
  typeof window !== 'undefined' && localStorage.getItem(LIGHTWELL_USE_MOCK_DATA_KEY) === 'true';


