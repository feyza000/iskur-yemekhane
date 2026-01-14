import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { request } from '../services/api';
import { motion } from 'framer-motion';

import { toast } from 'react-toastify';

const ResetPasswordPage = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.warn('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            toast.warn('Password must be at least 8 characters long.');
            return;
        }

        setLoading(true);

        try {
            await request('/password-reset/confirm/', {
                method: 'POST',
                body: JSON.stringify({
                    uid,
                    token,
                    password
                })
            });

            toast.success('Password reset successful! Redirecting to login...');

            // Redirect after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            console.error(err);
            if (err.error) {
                toast.error(err.error);
            } else {
                toast.error('An error occurred. The link may be invalid or expired.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Reset Password</h2>
                <p>Enter your new password below.</p>


                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Min. 8 characters"
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter password"
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Reseting...' : 'Set New Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
