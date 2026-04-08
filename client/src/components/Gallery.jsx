import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDesigns } from '../api';
import GalleryCard from './GalleryCard';
import './Gallery.css';

export default function Gallery() {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchDesigns(sort, page).then((data) => {
      setDesigns(data.designs || []);
      setTotal(data.total || 0);
    });
  }, [sort, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          Home
        </button>
        <h1>Gallery</h1>
        <div className="sort-buttons">
          <button
            className={`sort-btn ${sort === 'latest' ? 'active' : ''}`}
            onClick={() => { setSort('latest'); setPage(1); }}
          >
            Latest
          </button>
          <button
            className={`sort-btn ${sort === 'popular' ? 'active' : ''}`}
            onClick={() => { setSort('popular'); setPage(1); }}
          >
            Popular
          </button>
        </div>
      </header>

      {designs.length === 0 ? (
        <div className="gallery-empty">
          <p>No designs shared yet</p>
          <button className="cta-button" onClick={() => navigate('/studio')}>
            Create First Design
          </button>
        </div>
      ) : (
        <>
          <div className="gallery-grid">
            {designs.map((d) => (
              <GalleryCard key={d.id} design={d} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Prev
              </button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
