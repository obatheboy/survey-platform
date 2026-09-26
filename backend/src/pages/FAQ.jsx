import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FAQ.css';

const faqData = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I start earning on this platform?',
        a: 'Simply register an account, choose a survey plan (Regular, VIP, or VVIP), and start completing surveys. Each completed survey earns you money based on your chosen plan.'
      },
      {
        q: 'What are the different survey plans?',
        a: 'We offer three plans: Regular (KES 150 per survey, KES 1,500 total), VIP (KES 200 per survey, KES 2,000 total), and VVIP (KES 300 per survey, KES 3,000 total). Each plan requires completing 10 surveys.'
      },
      {
        q: 'Do I get a welcome bonus?',
        a: 'Yes! New users receive a KES 1,200 welcome bonus upon registration. You can withdraw this after activating your account.'
      }
    ]
  },
  {
    category: 'Account Activation',
    questions: [
      {
        q: 'Why do I need to activate my account?',
        a: 'Account activation (KES 100) verifies your identity and prevents fraud. It\'s a one-time payment that unlocks your ability to withdraw earnings.'
      },
      {
        q: 'How long does activation take?',
        a: 'Activation is typically processed within 24 hours after payment. You\'ll receive a notification once approved.'
      },
      {
        q: 'Can I complete surveys before activation?',
        a: 'Yes! You can complete surveys and earn money before activation, but you must activate your account to withdraw your earnings.'
      }
    ]
  },
  {
    category: 'Surveys',
    questions: [
      {
        q: 'How many surveys can I complete?',
        a: 'Each plan allows you to complete 10 surveys. You can select multiple plans to earn more.'
      },
      {
        q: 'How long does each survey take?',
        a: 'Most surveys take 5-10 minutes to complete. The time may vary based on the survey complexity.'
      },
      {
        q: 'What happens if I don\'t complete a survey?',
        a: 'You can return to incomplete surveys anytime. Your progress is saved automatically.'
      }
    ]
  },
  {
    category: 'Withdrawals',
    questions: [
      {
        q: 'How do I withdraw my earnings?',
        a: 'Go to the Withdraw tab, select your plan, enter the amount and your M-Pesa number, then submit. Withdrawals are processed within 24-48 hours.'
      },
      {
        q: 'What is the minimum withdrawal amount?',
        a: 'You can withdraw any amount from your completed survey earnings, but your account must be activated first.'
      },
      {
        q: 'Which payment methods are supported?',
        a: 'Currently, we support M-Pesa withdrawals. More payment methods will be added soon.'
      },
      {
        q: 'How long do withdrawals take?',
        a: 'Withdrawals are typically processed within 24-48 hours. You\'ll receive a notification when your payment is sent.'
      }
    ]
  },
  {
    category: 'Referrals',
    questions: [
      {
        q: 'Is there a referral program?',
        a: 'Yes! Refer friends and earn bonus rewards. Check your dashboard for your unique referral link.'
      },
      {
        q: 'How much do I earn per referral?',
        a: 'You earn KES 200 for each friend who registers and activates their account using your referral link.'
      }
    ]
  },
  {
    category: 'Troubleshooting',
    questions: [
      {
        q: 'I forgot my password. What should I do?',
        a: 'Click on "Forgot Password" on the login page and follow the instructions to reset your password.'
      },
      {
        q: 'My withdrawal is pending. What should I do?',
        a: 'Withdrawals typically take 24-48 hours. If it\'s been longer, please contact support with your transaction details.'
      },
      {
        q: 'I\'m having technical issues. Who do I contact?',
        a: 'Contact our support team through the help center or email us at support@surveyplatform.com'
      }
    ]
  }
];

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <button 
        className="faq-question" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <span className="faq-icon">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="faq-answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      item =>
        item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="faq-container">
      <header className="faq-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Frequently Asked Questions</h1>
        <p className="faq-subtitle">Find answers to common questions about our platform</p>
      </header>

      <div className="faq-search">
        <input
          type="text"
          placeholder="Search for answers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="faq-content">
        {filteredFAQ.length > 0 ? (
          filteredFAQ.map((category, idx) => (
            <div key={idx} className="faq-category">
              <h2 className="category-title">{category.category}</h2>
              <div className="faq-list">
                {category.questions.map((item, qIdx) => (
                  <FAQItem
                    key={qIdx}
                    question={item.q}
                    answer={item.a}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No results found for "{searchTerm}"</p>
            <button onClick={() => setSearchTerm('')}>Clear Search</button>
          </div>
        )}
      </div>

      <div className="faq-footer">
        <h3>Still have questions?</h3>
        <p>Can't find what you're looking for? Contact our support team.</p>
        <button className="contact-btn" onClick={() => navigate('/dashboard')}>
          Contact Support
        </button>
      </div>
    </div>
  );
}
