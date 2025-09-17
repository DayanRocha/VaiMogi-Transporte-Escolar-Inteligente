import { VehiclePosition } from './vehicleTrackingService';

class PositionSmoothingService {
  private positionBuffer: VehiclePosition[] = [];
  private maxBufferSize = 10;
  private smoothingFactor = 0.3; // Fator de suavização (0-1)

  smoothPosition(rawPosition: VehiclePosition): VehiclePosition {
    this.positionBuffer.push(rawPosition);
    
    // Manter buffer limitado
    if (this.positionBuffer.length > this.maxBufferSize) {
      this.positionBuffer.shift();
    }

    // Se precisão é muito baixa, aplicar suavização
    if (rawPosition.accuracy > 1000 && this.positionBuffer.length > 1) {
      return this.applyKalmanFilter(rawPosition);
    }

    return rawPosition;
  }

  private applyKalmanFilter(currentPosition: VehiclePosition): VehiclePosition {
    if (this.positionBuffer.length < 2) {
      return currentPosition;
    }

    const previousPosition = this.positionBuffer[this.positionBuffer.length - 2];
    
    // Filtro Kalman simplificado
    const smoothedLat = previousPosition.latitude + 
      this.smoothingFactor * (currentPosition.latitude - previousPosition.latitude);
    
    const smoothedLon = previousPosition.longitude + 
      this.smoothingFactor * (currentPosition.longitude - previousPosition.longitude);

    return {
      ...currentPosition,
      latitude: smoothedLat,
      longitude: smoothedLon,
      accuracy: Math.min(currentPosition.accuracy, previousPosition.accuracy * 1.2)
    };
  }

  private calculateWeightedAverage(): VehiclePosition | null {
    if (this.positionBuffer.length === 0) return null;

    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLon = 0;

    // Dar mais peso a posições mais recentes e precisas
    this.positionBuffer.forEach((pos, index) => {
      const recencyWeight = (index + 1) / this.positionBuffer.length;
      const accuracyWeight = 1 / (pos.accuracy || 1000);
      const weight = recencyWeight * accuracyWeight;

      weightedLat += pos.latitude * weight;
      weightedLon += pos.longitude * weight;
      totalWeight += weight;
    });

    const latestPosition = this.positionBuffer[this.positionBuffer.length - 1];
    
    return {
      ...latestPosition,
      latitude: weightedLat / totalWeight,
      longitude: weightedLon / totalWeight
    };
  }
}

export const positionSmoothingService = new PositionSmoothingService();