/**
 * ClanRegistrationPage Component
 *
 * Epic 2 Story 2.3: Post-Registration Triage - Register New Clan
 *
 * Allows newly registered users to create a new clan.
 * Upon successful clan creation, the user becomes the clan owner.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { apiClient, getApiErrorMessage } from '@/lib/api-client';

/**
 * Clan registration validation schema
 * Mirrors backend clanRegistrationSchema
 */
const clanRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, 'Clan name must be at least 2 characters')
    .max(100, 'Clan name cannot exceed 100 characters'),
  rovioId: z
    .number({ invalid_type_error: 'Rovio ID must be a number' })
    .int('Rovio ID must be an integer')
    .positive('Rovio ID must be positive')
    .max(2147483647, 'Rovio ID is too large'),
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country cannot exceed 100 characters'),
});

type ClanRegistrationFormData = {
  name: string;
  rovioId: string;
  country: string;
};

type ClanRegistrationResponse = {
  clanId: string;
  name: string;
  rovioId: number;
  country: string;
};

/**
 * ClanRegistrationPage Component
 */
export default function ClanRegistrationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ClanRegistrationFormData>({
    name: '',
    rovioId: '',
    country: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle input changes and clear field errors
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  /**
   * Validate form data using Zod schema
   */
  const validateForm = (): boolean => {
    try {
      const rovioIdNumber = parseInt(formData.rovioId, 10);
      if (isNaN(rovioIdNumber)) {
        setErrors({ rovioId: 'Rovio ID must be a number' });
        return false;
      }

      clanRegistrationSchema.parse({
        name: formData.name.trim(),
        rovioId: rovioIdNumber,
        country: formData.country.trim(),
      });

      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            const field = err.path[0] as string;
            fieldErrors[field] = err.message;
          }
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
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Async registration logic
    void (async () => {
      try {
        const rovioIdNumber = parseInt(formData.rovioId, 10);
        const payload = {
          name: formData.name.trim(),
          rovioId: rovioIdNumber,
          country: formData.country.trim(),
        };

        const response = await apiClient.post<ClanRegistrationResponse>(
          '/api/users/register-clan',
          payload
        );

        // Clan created successfully, invalidate queries and navigate
        void queryClient.invalidateQueries({ queryKey: ['user'] });
        void navigate(`/clans/${response.data.clanId}`, {
          state: { newClan: true, clanName: response.data.name },
        });
      } catch (error) {
        const errorMessage = getApiErrorMessage(error);
        setGeneralError(errorMessage);
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
            Register Your Clan
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create a new clan and become its owner
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* General Error */}
          {generalError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{generalError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Clan Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Clan Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="organization"
              required
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 block w-full appearance-none border px-3 py-2 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              } rounded-md placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm`}
              placeholder="Enter clan name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Your clan&apos;s display name (2-100 characters)
            </p>
          </div>

          {/* Rovio ID */}
          <div>
            <label htmlFor="rovioId" className="block text-sm font-medium text-gray-700">
              Rovio ID *
            </label>
            <input
              id="rovioId"
              name="rovioId"
              type="text"
              inputMode="numeric"
              required
              value={formData.rovioId}
              onChange={handleChange}
              className={`mt-1 block w-full appearance-none border px-3 py-2 ${
                errors.rovioId ? 'border-red-300' : 'border-gray-300'
              } rounded-md placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm`}
              placeholder="Enter Rovio ID"
            />
            {errors.rovioId && <p className="mt-1 text-sm text-red-600">{errors.rovioId}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Your clan&apos;s unique Rovio identifier (found in-game)
            </p>
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              Country *
            </label>
            <input
              id="country"
              name="country"
              type="text"
              autoComplete="country-name"
              required
              value={formData.country}
              onChange={handleChange}
              className={`mt-1 block w-full appearance-none border px-3 py-2 ${
                errors.country ? 'border-red-300' : 'border-gray-300'
              } rounded-md placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm`}
              placeholder="Enter country"
            />
            {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Your clan&apos;s country or region (2-100 characters)
            </p>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="hover:bg-primary-dark group relative flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Clan...' : 'Create Clan'}
            </button>
          </div>

          {/* Help Text */}
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">How to find your Rovio ID</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Open Angry Birds 2, go to your clan page, and look for the clan ID number. This
                    is your Rovio ID.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <Link
              to="/register/triage"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              ← Back to previous step
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
