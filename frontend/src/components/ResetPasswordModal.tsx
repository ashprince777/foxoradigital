
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Lock } from 'lucide-react';
import api from '../api/axios';

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
    userName: string;
}

const resetPasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, userId, userName }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordFormValues) => {
        if (!userId) return;

        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await api.put(`/users/${userId}`, { password: data.password });
            setSuccessMessage(`Password for ${userName} has been successfully reset.`);
            reset();
            setTimeout(() => {
                onClose();
                setSuccessMessage(null);
            }, 2000);
        } catch (err: any) {
            console.error('Failed to reset password', err);
            setError(
                typeof err.response?.data?.error === 'string'
                    ? err.response.data.error
                    : 'Failed to reset password.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                    &#8203;
                </span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                                <Lock className="h-5 w-5 mr-2 text-indigo-500" />
                                Reset Password for {userName}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
                                <p className="text-sm text-green-700">{successMessage}</p>
                            </div>
                        )}

                        {!successMessage && (
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                                        New Password
                                    </label>
                                    <input
                                        {...register('password')}
                                        id="password"
                                        type="password"
                                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.password ? 'border-red-500' : ''}`}
                                        placeholder="Enter new password"
                                    />
                                    {errors.password && <p className="text-red-500 text-xs italic">{errors.password.message}</p>}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                                        Confirm Password
                                    </label>
                                    <input
                                        {...register('confirmPassword')}
                                        id="confirmPassword"
                                        type="password"
                                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                        placeholder="Confirm new password"
                                    />
                                    {errors.confirmPassword && <p className="text-red-500 text-xs italic">{errors.confirmPassword.message}</p>}
                                </div>

                                <div className="flex items-center justify-end mt-6">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isSubmitting ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordModal;
