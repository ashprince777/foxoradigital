import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

const Settings: React.FC = () => {
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            if (response.data?.authorizedSignatureUrl) {
                const url = response.data.authorizedSignatureUrl;
                // If it's a full URL (Supabase), use it. otherwise append base URL.
                if (url.startsWith('http')) {
                    setSignatureUrl(url);
                } else {
                    setSignatureUrl(`${api.defaults.baseURL?.replace('/api', '')}${url}`);
                }
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('signature', file);

        setIsLoading(true);
        setUploadStatus('idle');

        try {
            const response = await api.post('/settings/signature', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.authorizedSignatureUrl) {
                const url = response.data.authorizedSignatureUrl;
                if (url.startsWith('http')) {
                    setSignatureUrl(url);
                } else {
                    setSignatureUrl(`${api.defaults.baseURL?.replace('/api', '')}${url}`);
                }
                setUploadStatus('success');
                setMessage('Signature uploaded successfully!');
            }
        } catch (error) {
            console.error('Failed to upload signature', error);
            setUploadStatus('error');
            setMessage('Failed to upload signature. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 font-display">Settings</h1>

            <div className="bg-white shadow-soft rounded-xl border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Invoice Settings</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-md font-medium text-gray-700 mb-2">authorized signature</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Upload an image of your authorized signature. This will be displayed on all generated PDF invoices.
                            Recommended size: 200x100px (PNG or JPG).
                        </p>

                        <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 transition-colors cursor-pointer group relative">
                            <div className="space-y-1 text-center">
                                {isLoading ? (
                                    <div className="flex flex-col items-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-2"></div>
                                        <p className="text-sm text-gray-500">Uploading...</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                        <div className="flex text-sm text-gray-600">
                                            <label
                                                htmlFor="file-upload"
                                                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                            >
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg" />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG to 2MB</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {uploadStatus === 'success' && (
                            <div className="mt-3 flex items-center text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {message}
                            </div>
                        )}
                        {uploadStatus === 'error' && (
                            <div className="mt-3 flex items-center text-red-600 text-sm">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                {message}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-500 mb-4">Current Signature Preview</h4>
                        {signatureUrl ? (
                            <div className="bg-white p-4 shadow-sm border rounded">
                                <img src={signatureUrl} alt="Authorized Signature" className="max-h-24 object-contain" />
                            </div>
                        ) : (
                            <div className="text-gray-400 text-sm italic">No signature uploaded</div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">Will appear in invoice footer</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
