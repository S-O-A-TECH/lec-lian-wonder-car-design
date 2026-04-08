import { useNavigate } from 'react-router-dom';

export default function GalleryCard({ design }) {
  const navigate = useNavigate();

  return (
    <div className="gallery-card" onClick={() => navigate(`/design/${design.id}`)}>
      <div className="card-image">
        <img src={design.thumbnail} alt={design.title} loading="lazy" />
      </div>
      <div className="card-body">
        <div className="card-title">{design.title}</div>
        <div className="card-meta">
          <span className="card-author">{design.nickname}</span>
          <span className="card-likes">{design.likes_count} likes</span>
        </div>
      </div>
    </div>
  );
}
