import { useState, useEffect } from 'react';
import './Testimonials.css';

const testimonialsData = [
  {
    id: 1,
    name: 'John Mwangi',
    location: 'Nairobi',
    avatar: '👨‍💼',
    earned: 'KES 45,000',
    duration: '3 months',
    rating: 5,
    quote: "I've been earning consistently every month. The platform is legit and withdrawals are instant. Highly recommended!",
    verified: true
  },
  {
    id: 2,
    name: 'Mary Akinyi',
    location: 'Kisumu',
    avatar: '👩‍💼',
    earned: 'KES 32,500',
    duration: '2 months',
    rating: 5,
    quote: "At first I was skeptical, but after my first withdrawal I was convinced. This is the real deal!",
    verified: true
  },
  {
    id: 3,
    name: 'Peter Kamau',
    location: 'Mombasa',
    avatar: '👨',
    earned: 'KES 58,200',
    duration: '4 months',
    rating: 5,
    quote: "Best decision I made this year. I earn while doing other things. The surveys are easy and payment is guaranteed.",
    verified: true
  },
  {
    id: 4,
    name: 'Grace Wanjiru',
    location: 'Nakuru',
    avatar: '👩',
    earned: 'KES 28,900',
    duration: '1 month',
    rating: 5,
    quote: "I was able to pay my rent with earnings from this platform. Thank you for this opportunity!",
    verified: true
  },
  {
    id: 5,
    name: 'David Omondi',
    location: 'Eldoret',
    avatar: '👨‍🎓',
    earned: 'KES 41,300',
    duration: '3 months',
    rating: 5,
    quote: "As a student, this has been a lifesaver. I can earn money for upkeep without leaving my studies.",
    verified: true
  },
  {
    id: 6,
    name: 'Faith Njeri',
    location: 'Thika',
    avatar: '👩‍🎓',
    earned: 'KES 36,700',
    duration: '2 months',
    rating: 5,
    quote: "The welcome bonus alone was worth it! I've been earning steadily since then. Very reliable platform.",
    verified: true
  }
];

export default function Testimonials({ variant = 'carousel' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || variant !== 'carousel') return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonialsData.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, variant]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonialsData.length);
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonialsData.length) % testimonialsData.length);
    setIsAutoPlaying(false);
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  if (variant === 'grid') {
    return (
      <div className="testimonials-grid">
        <h2 className="testimonials-title">What Our Users Say</h2>
        <div className="testimonials-grid-container">
          {testimonialsData.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="testimonial-header">
                <div className="avatar">{testimonial.avatar}</div>
                <div className="user-info">
                  <h4>
                    {testimonial.name}
                    {testimonial.verified && <span className="verified">✓</span>}
                  </h4>
                  <p className="location">{testimonial.location}</p>
                </div>
              </div>
              <div className="rating">{renderStars(testimonial.rating)}</div>
              <p className="quote">"{testimonial.quote}"</p>
              <div className="stats">
                <span className="earned">{testimonial.earned} earned</span>
                <span className="duration">{testimonial.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Carousel variant (default)
  const currentTestimonial = testimonialsData[currentIndex];

  return (
    <div className="testimonials-carousel">
      <h2 className="testimonials-title">What Our Users Say</h2>
      <div className="carousel-container">
        <button className="carousel-btn prev" onClick={prevTestimonial}>
          ‹
        </button>

        <div className="testimonial-slide">
          <div className="testimonial-content">
            <div className="avatar-large">{currentTestimonial.avatar}</div>
            <div className="rating">{renderStars(currentTestimonial.rating)}</div>
            <p className="quote-large">"{currentTestimonial.quote}"</p>
            <div className="user-details">
              <h3>
                {currentTestimonial.name}
                {currentTestimonial.verified && <span className="verified">✓</span>}
              </h3>
              <p className="location">{currentTestimonial.location}</p>
            </div>
            <div className="stats-large">
              <div className="stat">
                <span className="label">Total Earned</span>
                <span className="value">{currentTestimonial.earned}</span>
              </div>
              <div className="stat">
                <span className="label">Member Since</span>
                <span className="value">{currentTestimonial.duration}</span>
              </div>
            </div>
          </div>
        </div>

        <button className="carousel-btn next" onClick={nextTestimonial}>
          ›
        </button>
      </div>

      <div className="carousel-dots">
        {testimonialsData.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => {
              setCurrentIndex(index);
              setIsAutoPlaying(false);
            }}
          />
        ))}
      </div>
    </div>
  );
}
