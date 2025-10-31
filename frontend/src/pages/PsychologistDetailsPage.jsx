import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const PsychologistDetailsPage = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`/api/psychologists/${id}`);
        setItem(res.data || null);
      } catch (e) {
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!item) return <div style={{ padding: 24 }}>Not found</div>;

  const name = item.User ? `${item.User.firstName || ''} ${item.User.lastName || ''}`.trim() || 'Psychologist' : 'Psychologist';

  return (
    <div style={{ maxWidth: 800, margin: '24px auto' }}>
      <Link to="/psychologists">← Back</Link>
      <h2>{name}</h2>
      {item.specialization && <div>Specialization: {item.specialization}</div>}
      <div>Experience: {item.experience} years</div>
      {item.bio && <p>{item.bio}</p>}
      {item.price != null && <div>Price: ${item.price}</div>}
    </div>
  );
};

export default PsychologistDetailsPage;


