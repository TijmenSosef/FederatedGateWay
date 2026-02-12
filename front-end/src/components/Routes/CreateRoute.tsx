
import { Link } from 'react-router-dom';

export const CreateRoute = () => {
  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px dashed #ccc', textAlign: 'center' }}>
      <p>Want to create a new route in your YAML configuration?</p>
      <Link to="/designer">
        <button style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Open Route Designer
        </button>
      </Link>
    </div>
  );
};