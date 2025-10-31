import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [me, setMe] = useState(user);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [psychProfile, setPsychProfile] = useState({
    specialization: '',
    experience: 0,
    bio: '',
    price: ''
  });

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axios.get('/api/auth/me');
        setMe(res.data);
      } catch (e) {
      }
    };
    fetchMe();
  }, []);

  const onChangePsych = (e) => {
    const { name, value } = e.target;
    setPsychProfile((p) => ({ ...p, [name]: value }));
  };

  const onSubmitPsych = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await axios.put('/api/psychologists/profile', psychProfile);
      setMessage('Profile updated');
    } catch (err) {
      setError(err?.response?.data?.msg || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '24px auto' }}>
      <h2>My Profile</h2>
      {me && (
        <div style={{ marginBottom: 16 }}>
          <div>Email: {me.email}</div>
          <div>Role: {me.role}</div>
        </div>
      )}
      <button onClick={logout} style={{ marginBottom: 24 }}>Logout</button>

      {me?.role === 'psychologist' && (
        <div>
          <h3>Psychologist Profile</h3>
          {message && <div style={{ color: 'green' }}>{message}</div>}
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <form onSubmit={onSubmitPsych}>
            <div style={{ marginBottom: 12 }}>
              <label>Specialization</label>
              <input name="specialization" value={psychProfile.specialization} onChange={onChangePsych} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Experience (years)</label>
              <input name="experience" type="number" value={psychProfile.experience} onChange={onChangePsych} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Bio</label>
              <textarea name="bio" value={psychProfile.bio} onChange={onChangePsych} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Price</label>
              <input name="price" type="number" step="0.01" value={psychProfile.price} onChange={onChangePsych} style={{ width: '100%' }} />
            </div>
            <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;


