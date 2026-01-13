import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onSave: (userId: string, allowedMenus: string[]) => Promise<void>;
}

const ALL_MENUS = [
    'Dashboard',
    'Projects',
    'Tasks',
    'Content Calendar',
    'Client List',
    'Payment Details',
    'Client Portal',
    'Invoices',
    'User Management'
];

const MenuPermissionsModal: React.FC<Props> = ({ isOpen, onClose, user, onSave }) => {
    const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            try {
                if (user.allowedMenus) {
                    setSelectedMenus(JSON.parse(user.allowedMenus));
                } else {
                    // Default to all if not set, or none? 
                    // If not set, usually means full access or role based.
                    // But if we are configuring, we probably start with Checked All?
                    // Let's assume checked all for new config.
                    setSelectedMenus(ALL_MENUS);
                }
            } catch (e) {
                setSelectedMenus(ALL_MENUS);
            }
        }
    }, [isOpen, user]);

    const handleToggle = (menu: string) => {
        setSelectedMenus(prev =>
            prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(user.id, selectedMenus);
        setIsSaving(false);
        onClose();
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Menu Access: {user.name}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto p-2">
                        {ALL_MENUS.map(menu => (
                            <div key={menu} className="flex items-center">
                                <input
                                    id={`menu-${menu}`}
                                    type="checkbox"
                                    checked={selectedMenus.includes(menu)}
                                    onChange={() => handleToggle(menu)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`menu-${menu}`} className="ml-3 block text-sm font-medium text-gray-700">
                                    {menu}
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save Permissions'}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenuPermissionsModal;
