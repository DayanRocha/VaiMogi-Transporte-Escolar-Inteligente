import { VehiclePosition } from './vehicleTrackingService';

interface GPSQualityMetrics {
  averageAccuracy: number;
  positionCount: number;
  rejectionRate: number;
  lastUpdate: Date;
  signalStrength: 'excellent' | 'good' | 'fair' | 'poor';
}

class GPSMonitoringService {
  private metrics: GPSQualityMetrics = {
    averageAccuracy: 0,
    positionCount: 0,
    rejectionRate: 0,
    lastUpdate: new Date(),
    signalStrength: 'poor'
  };

  private totalPositions = 0;
  private rejectedPositions = 0;
  private accuracySum = 0;

  logPositionUpdate(position: VehiclePosition, wasAccepted: boolean) {
    this.totalPositions++;
    
    if (wasAccepted) {
      this.accuracySum += position.accuracy;
      this.metrics.positionCount++;
      this.metrics.averageAccuracy = this.accuracySum / this.metrics.positionCount;
    } else {
      this.rejectedPositions++;
    }

    this.metrics.rejectionRate = (this.rejectedPositions / this.totalPositions) * 100;
    this.metrics.lastUpdate = new Date();
    this.metrics.signalStrength = this.calculateSignalStrength();

    // Log detalhado para debugging
    console.log('📊 GPS Quality Metrics:', {
      position: {
        lat: position.latitude.toFixed(6),
        lon: position.longitude.toFixed(6),
        accuracy: `${position.accuracy.toFixed(1)}m`,
        age: `${Date.now() - position.timestamp}ms`,
        accepted: wasAccepted
      },
      metrics: {
        avgAccuracy: `${this.metrics.averageAccuracy.toFixed(1)}m`,
        rejectionRate: `${this.metrics.rejectionRate.toFixed(1)}%`,
        signalStrength: this.metrics.signalStrength,
        totalPositions: this.totalPositions
      }
    });
  }

  private calculateSignalStrength(): 'excellent' | 'good' | 'fair' | 'poor' {
    const avgAccuracy = this.metrics.averageAccuracy;
    
    if (avgAccuracy <= 10) return 'excellent';
    if (avgAccuracy <= 50) return 'good';
    if (avgAccuracy <= 200) return 'fair';
    return 'poor';
  }

  getQualityReport(): GPSQualityMetrics {
    return { ...this.metrics };
  }

  shouldRecommendRecalibration(): boolean {
    return this.metrics.rejectionRate > 50 || this.metrics.averageAccuracy > 500;
  }
}

export const gpsMonitoringService = new GPSMonitoringService();