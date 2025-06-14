# QR Engine v2 Analytics Dashboard

## Overview

A dedicated analytics dashboard has been implemented for QR Engine v2, providing comprehensive insights into code generation, customization features usage, performance metrics, and cache efficiency.

## Architecture

### Backend Implementation

#### New Endpoints
```typescript
// Analytics endpoint
GET /api/qr/analytics
Authorization: Bearer {token}

// Cache statistics
GET /api/qr/cache/stats
Authorization: Bearer {token}

// Clear cache
POST /api/qr/cache/clear
Authorization: Bearer {token}
```

### Frontend Implementation

#### Component Structure
- **QRv2AnalyticsDisplay.tsx**: Main analytics component with tabbed interface
- **Integration**: Added to main dashboard with dedicated tab

## Features

### 1. Overview Tab
- **Key Metrics**:
  - Total Requests
  - v2 Adoption Rate (currently 100% as all QR are v2)
  - Average Response Time
  - Cache Hit Time
- **24-Hour Performance Summary**:
  - Request count
  - Average and P95 response times
  - Error tracking

### 2. Performance Tab
- **Response Time Distribution**:
  - Cache hits vs misses comparison
  - Visual progress bars
- **Error Rate Monitoring**:
  - Real-time error percentage
  - Historical error tracking

### 3. Features Tab
- **Feature Adoption Metrics**:
  - Gradients usage
  - Logo embedding
  - Custom shapes (eye patterns, data patterns)
  - Visual effects
  - Frames
- **Popular Feature Combinations**:
  - Track which features are used together
  - Usage frequency

### 4. Cache Tab
- **Cache Performance**:
  - Hit rate percentage
  - Total entries
  - Memory usage
  - Average hit time
- **Cache Management**:
  - One-click cache clearing
  - Real-time updates

## Visual Design

### Color Scheme
- **Blue**: Primary metrics and live data
- **Green**: Success indicators and adoption rates
- **Purple**: Performance metrics
- **Amber**: Cache and optimization metrics

### Icons
- Zap (⚡): QR Engine v2 indicator
- Activity: Live data
- TrendingUp: Performance improvements
- Database: Cache metrics
- Feature-specific icons for customization options

## Technical Details

### Data Flow
```
Rust Generator
    ↓
Analytics Endpoint (/analytics/performance)
    ↓
Backend Service (qrService.ts)
    ↓
Transform & Aggregate Data
    ↓
Frontend Component (QRv2AnalyticsDisplay)
    ↓
Visualized Dashboard
```

### Update Frequency
- **Auto-refresh**: Every 60 seconds
- **Manual refresh**: Available via refresh button
- **Real-time indicators**: Show data freshness

## Current Limitations & Future Enhancements

### Current Limitations
1. **Feature Usage**: Currently returns mock data (0) as Rust doesn't track feature usage yet
2. **v1 vs v2 Comparison**: Not available as v1 is deprecated
3. **Historical Data**: No time-series graphs yet
4. **User-level Analytics**: Not implemented

### Planned Enhancements
1. **Rust Integration**:
   ```rust
   // Track feature usage
   struct FeatureUsage {
       gradients: AtomicU64,
       logos: AtomicU64,
       custom_shapes: AtomicU64,
       effects: AtomicU64,
       frames: AtomicU64,
   }
   ```

2. **Time-Series Graphs**:
   - Response time trends
   - Request volume over time
   - Cache efficiency history

3. **Advanced Metrics**:
   - SVG size distribution
   - Complexity scoring
   - Generation time by feature combination

4. **Export Capabilities**:
   - CSV export for reports
   - API for external monitoring tools

## Usage Instructions

### Accessing the Dashboard
1. Navigate to `/dashboard`
2. Requires SUPERADMIN role
3. Click "QR Engine v2" tab

### Key Actions
- **Refresh Data**: Click refresh button
- **Clear Cache**: Use "Clear Cache" button in Cache tab
- **Switch Views**: Use tabs to navigate between metrics

### Interpreting Metrics
- **High Cache Hit Rate**: Good performance, efficient caching
- **Low Response Time**: Fast generation
- **Feature Usage**: Understand what users value
- **Error Rate**: Should remain at 0%

## Security
- All endpoints require authentication
- SUPERADMIN role required for access
- Token-based authorization
- No sensitive data exposed

## Performance Impact
- Minimal overhead on Rust generator
- Analytics aggregated asynchronously
- Dashboard updates don't block generation
- Efficient data transfer (< 5KB per update)