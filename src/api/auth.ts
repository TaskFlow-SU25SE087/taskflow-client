import axiosClient from '@/configs/axiosClient'
import { AuthResponse, User } from '@/types/auth'

const ENDPOINT = '/auth'

export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await axiosClient.post<{
        code: number
        message: string
        data: {
          accessToken: string
          refreshToken: string
        }
      }>(`${ENDPOINT}/login`, {
        username,
        password
      })

      const { accessToken, refreshToken } = response.data.data

      // Store tokens
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      localStorage.setItem('refreshToken', refreshToken)

      return {
        accessToken,
        refreshToken
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  register: async (email: string, fullName: string, password: string, confirmPassword: string): Promise<AuthResponse> => {
    try {
      const formData = new FormData();
      formData.append('Email', email);
      formData.append('FullName', fullName);
      formData.append('Password', password);
      formData.append('ConfirmPassword', confirmPassword);

      console.log('Register request payload:', {
        Email: email,
        FullName: fullName,
        Password: password,
        ConfirmPassword: confirmPassword
      });
      console.log('Request URL:', `${ENDPOINT}/register`);
      console.log('Request headers:', {
        'Content-Type': 'multipart/form-data'
      });

      const response = await axiosClient.post<{
        code: number
        message: string
        data: {
          accessToken: string
          refreshToken: string
        }
      }>(`${ENDPOINT}/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('Register response:', response.data);

      const { accessToken, refreshToken } = response.data.data

      // Store tokens
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      localStorage.setItem('refreshToken', refreshToken)

      return {
        accessToken,
        refreshToken
      }
    } catch (error: any) {
      console.error('Register error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        fullError: error,
        responseData: error.response?.data,
        requestData: error.config?.data,
        validationErrors: error.response?.data?.errors,
        responseHeaders: error.response?.headers,
        requestHeaders: error.config?.headers,
        requestURL: error.config?.url
      });
      
      if (error.response?.data?.errors) {
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('\n');
        throw new Error(errorMessages);
      }
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Registration failed. Please try again.');
    }
  },

  refreshToken: async (accessToken: string, refreshToken: string): Promise<AuthResponse> => {
    try {
      const response = await axiosClient.post<{
        code: number
        message: string
        data: {
          accessToken: string
          refreshToken: string
        }
      }>(`${ENDPOINT}/refresh-token`, {
        accessToken,
        refreshToken
      })

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data

      // Update tokens
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
      localStorage.setItem('refreshToken', newRefreshToken)

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  verifyEmail: async (token: string): Promise<void> => {
    try {
      const response = await axiosClient.post<{
        code: number
        message: string
        data: boolean
      }>(`${ENDPOINT}/verify-email?token=${token}`)

      if (response.data.code !== 200) {
        throw new Error(response.data.message)
      }
    } catch (error: any) {
      console.error('Verify email error:', error.response?.data)
      throw error
    }
  },

  resendVerificationEmail: async (): Promise<boolean> => {
    try {
      const response = await axiosClient.post<{
        code: number
        message: string
        data: boolean
      }>(`${ENDPOINT}/send-mail-again`)

      return response.data.data
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw error
    }
  },

  logout: () => {
    delete axiosClient.defaults.headers.common['Authorization']
    localStorage.removeItem('refreshToken')
  },

  verifyOtp: async (otp: string): Promise<void> => {
    try {
      const response = await axiosClient.post<{
        code: number
        message: string
      }>(`${ENDPOINT}/verify-email?token=${otp}`)

      if (response.data.code !== 200) {
        throw new Error(response.data.message)
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error.response?.data)
      throw error
    }
  },

  addUsername: async (username: string, avatar: File | null, phoneNumber: string): Promise<User> => {
    try {
      const formData = new FormData();
      formData.append('Username', username);
      if (avatar) {
        formData.append('Avatar', avatar);
      }
      if (phoneNumber) {
        formData.append('PhoneNumber', phoneNumber);
      }

      console.log('Sending addUsername request with data:', {
        username,
        hasAvatar: !!avatar,
        phoneNumber,
        formDataEntries: Array.from(formData.entries())
      });

      const response = await axiosClient.post<{
        code: number;
        message: string;
        data: {
          id: string;
          avatar: string;
          fullName: string;
          role: string;
          email: string;
          phoneNumber: string;
          username: string;
        };
      }>(`${ENDPOINT}/add-username`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.code !== 200) {
        throw new Error(response.data.message);
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Add username error:', error.response?.data);
      
      // Log detailed error information
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('\n');
        throw new Error(`Validation failed:\n${errorMessages}`);
      }
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw error;
    }
  },

  activate: async (email: string, username: string, newPassword: string, confirmPassword: string, tokenResetPassword: string): Promise<string> => {
    try {
      const response = await axiosClient.post<{
        code: number;
        message: string;
        data: string;
      }>(`${ENDPOINT}/activate`, {
        email,
        username,
        newPassword,
        confirmPassword,
        tokenResetPassword
      });

      if (response.data.code !== 200) {
        throw new Error(response.data.message);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Activate account error:', error.response?.data);
      
      if (error.response?.data?.errors) {
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('\n');
        throw new Error(errorMessages);
      }
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Account activation failed. Please try again.');
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await axiosClient.get<{
        code: number;
        message: string;
        data: {
          id: string;
          avatar: string;
          fullName: string;
          role: string;
          email: string;
          phoneNumber: string;
          username: string;
        };
      }>(`${ENDPOINT}/me`);

      if (response.data.code !== 200) {
        throw new Error(response.data.message);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Get current user error:', error.response?.data);
      throw error;
    }
  },
}
