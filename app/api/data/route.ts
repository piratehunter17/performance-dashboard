import { NextResponse } from 'next/server';
import { generateNewDataPoint } from '@/lib/dataGenerator';

// We can use the Edge runtime for lightweight, fast API responses
export const runtime = 'edge';

/**
 * API route to fetch a single new data point.
 * This simulates a real-time data source.
 *
 * @returns {NextResponse} A JSON response with a single DataPoint.
 */
export async function GET() {
  try {
    const newDataPoint = generateNewDataPoint();
    
    // Respond with the new data point
    return NextResponse.json(newDataPoint);
  } catch (error) {
    // Basic error handling
    return new NextResponse(
      JSON.stringify({ error: 'Failed to generate data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}