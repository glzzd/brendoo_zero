import apiClient from '../utils/apiClient';
import { API_BASE_URL } from '../const/endpoints';

// Scraper API functions
export const getScrapers = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/scrapers${queryParams ? `?${queryParams}` : ''}`;
        const response = await apiClient.get(url);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const createScraper = async (scraperData) => {
    try {
        const response = await apiClient.post(`${API_BASE_URL}/scrapers`, scraperData);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const updateScraper = async (id, scraperData) => {
    try {
        const response = await apiClient.put(`${API_BASE_URL}/scrapers/${id}`, scraperData);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const deleteScraper = async (id) => {
    try {
        const response = await apiClient.delete(`${API_BASE_URL}/scrapers/${id}`);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const startScraper = async (id) => {
    try {
        const response = await apiClient.post(`${API_BASE_URL}/scrapers/${id}/start`);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const stopScraper = async (id) => {
    try {
        const response = await apiClient.post(`${API_BASE_URL}/scrapers/${id}/stop`);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

// Store API functions
export const getStores = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/store${queryParams ? `?${queryParams}` : ''}`;
        const response = await apiClient.get(url);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const createStore = async (storeData) => {
    try {
        const response = await apiClient.post(`${API_BASE_URL}/store`, storeData);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const updateStore = async (id, storeData) => {
    try {
        const response = await apiClient.put(`${API_BASE_URL}/store/${id}`, storeData);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const deleteStore = async (id) => {
    try {
        const response = await apiClient.delete(`${API_BASE_URL}/store/${id}`);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

// Python Scraper Upload function
export const uploadPythonScraper = async (formData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/scrapers/upload-python`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type for FormData, let browser set it with boundary
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed');
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
};

// Auth API functions
export const login = async (credentials) => {
    try {
        const response = await apiClient.post(`${API_BASE_URL}/auth/login`, credentials);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const register = async (userData) => {
    try {
        const response = await apiClient.post(`${API_BASE_URL}/auth/register`, userData);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const logout = async () => {
    try {
        const response = await apiClient.post(`${API_BASE_URL}/auth/logout`);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const refreshToken = async (refreshToken) => {
    try {
        const response = await apiClient.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        return await response.json();
    } catch (error) {
        throw error;
    }
};