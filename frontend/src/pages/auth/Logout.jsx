import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { baseUrl, baseUserUrlPrefix } from '../../utils/baseUrl'
import { logoutSuccess } from '../../redux/slices/authSlice'
import './Logout.scss'

function Logout() {
    const { user, isAdmin, isHead } = useSelector(store => store.auth)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    
    const logoutHandler = async () => {
        try {
            // Send logout request to backend
            const res = await axios.post(
                `${baseUrl}${baseUserUrlPrefix}/logout`, 
                {}, 
                { withCredentials: true }
            )
            
            if (res.data.success) {
                // Dispatch logout success to clear Redux state
                dispatch(logoutSuccess())
                
                // Clear localStorage
                localStorage.removeItem('user')
                localStorage.removeItem('isAuthenticated')
                localStorage.removeItem('token')
                
                // Show success message
                // alert('Logged out successfully!')
                
                // Navigate to login page
                navigate('/login')
            } else {
                alert('Logout failed: ' + (res.data.message || 'Unknown error'))
            }
        } catch (error) {
            console.error('Logout error:', error)
            
            // Even if server logout fails, clear client-side state
            dispatch(logoutSuccess())
            localStorage.clear()
            
            alert('Logged out from client. Server error: ' + error.message)
            navigate('/login')
        }
    }

    const handleCancel = () => {
        navigate(-1) // Go back to previous page
    }

    return (
        <div className="logout-container">
            <div className="logout-card">
                <div className="logout-header">
                    {/* <div className="warning-icon">
                        ⚠️
                    </div> */}
                    <h1>Logout Confirmation</h1>
                    <p className="logout-message">
                        Are you sure you want to log out?
                    </p>
                </div>

                {user && (
                    <div className="user-info">
                        <div className="info-row">
                            <span className="label">Logged in as:</span>
                            <span className="value">{user.userName || user.userId}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">User ID:</span>
                            <span className="value">{user.userId}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Role:</span>
                            <div className="role-badges">
                                {isAdmin && <span className="badge admin">Admin</span>}
                                {isHead && <span className="badge head">Head</span>}
                            </div>
                        </div>
                    </div>
                )}

                <div className="logout-actions">
                    <button 
                        className="btn-cancel" 
                        onClick={handleCancel}
                        type="button"
                    >
                        Cancel
                    </button>
                    <button 
                        className="btn-logout" 
                        onClick={logoutHandler}
                        type="button"
                    >
                        Logout
                    </button>
                </div>

                <div className="logout-footer">
                    <p className="note">
                        <span className="icon">ℹ️</span>
                        You will be redirected to the login page after logout.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Logout