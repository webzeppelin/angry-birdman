/**
 * RegisterPage Component
 *
 * User registration form for Epic 2 Story 2.2: Self-Register as Clan Admin
 *
 * Allows new users to create accounts with username, email, and password.
 * After successful registration, users are directed to PostRegistrationTriage
 * to either register a new clan or request access to an existing clan.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { apiClient, getApiErrorMessage } from '@/lib/api-client';

/**
 * Client-side registration schema with password confirmation
 * Extends the API schema to include passwordConfirm for UX
 */
const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(100, 'Username cannot exceed 100 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores, and hyphens'
      ),
    email: z.string().email('Invalid email address').max(255, 'Email cannot exceed 255 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * API response for successful registration
 */
interface RegisterResponse {
  userId: string;
  message: string;
}

/**
 * RegisterPage Component
 */
export default function RegisterPage() {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  // UI state
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    try {
      registerSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof RegisterFormData;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setApiError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Async registration logic
    void (async () => {
      try {
        // Prepare API payload (exclude passwordConfirm)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordConfirm, ...apiPayload } = formData;

        // Call registration API
        const response = await apiClient.post<RegisterResponse>('/api/users/register', apiPayload);

        // Navigate to post-registration triage
        navigate('/register/triage', {
          state: { userId: response.data.userId, username: formData.username },
        });
      } catch (error) {
        const errorMessage = getApiErrorMessage(error);
        setApiError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Angry Birdman to manage your clan&apos;s battle data
          </p>
        </div>

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* API Error Message */}
          {apiError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Registration failed</h3>
                  <div className="mt-2 text-sm text-red-700">{apiError}</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className={`relative mt-1 block w-full appearance-none border px-3 py-2 ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                } focus:ring-primary focus:border-primary rounded-md text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none sm:text-sm`}
                placeholder="username"
              />
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`relative mt-1 block w-full appearance-none border px-3 py-2 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } focus:ring-primary focus:border-primary rounded-md text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none sm:text-sm`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`relative mt-1 block w-full appearance-none border px-3 py-2 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } focus:ring-primary focus:border-primary rounded-md text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none sm:text-sm`}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              <p className="mt-1 text-xs text-gray-500">
                At least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Password Confirmation */}
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                required
                value={formData.passwordConfirm}
                onChange={handleChange}
                className={`relative mt-1 block w-full appearance-none border px-3 py-2 ${
                  errors.passwordConfirm ? 'border-red-300' : 'border-gray-300'
                } focus:ring-primary focus:border-primary rounded-md text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none sm:text-sm`}
                placeholder="••••••••"
              />
              {errors.passwordConfirm && (
                <p className="mt-1 text-sm text-red-600">{errors.passwordConfirm}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white ${
                isSubmitting
                  ? 'bg-primary-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-600 focus:ring-primary focus:outline-none focus:ring-2 focus:ring-offset-2'
              }`}
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          {/* Sign-in Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary-600 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
