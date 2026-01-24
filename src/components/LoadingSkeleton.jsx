import './LoadingSkeleton.css';

export function CardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text short"></div>
      <div className="skeleton skeleton-button"></div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="skeleton-header">
        <div className="skeleton skeleton-circle"></div>
        <div className="skeleton skeleton-title"></div>
      </div>
      
      <div className="skeleton-hero">
        <div className="skeleton skeleton-greeting"></div>
        <div className="skeleton-earnings">
          <div className="skeleton skeleton-earning-card"></div>
          <div className="skeleton skeleton-earning-card"></div>
        </div>
      </div>

      <div className="skeleton-tabs">
        <div className="skeleton skeleton-tab"></div>
        <div className="skeleton skeleton-tab"></div>
      </div>

      <div className="skeleton-cards">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="table-skeleton">
      <div className="skeleton skeleton-table-header"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-table-row"></div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="form-skeleton">
      <div className="skeleton skeleton-input"></div>
      <div className="skeleton skeleton-input"></div>
      <div className="skeleton skeleton-input"></div>
      <div className="skeleton skeleton-button"></div>
    </div>
  );
}

export default {
  Card: CardSkeleton,
  Dashboard: DashboardSkeleton,
  Table: TableSkeleton,
  Form: FormSkeleton,
};
