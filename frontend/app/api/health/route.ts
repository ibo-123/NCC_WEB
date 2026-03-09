import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('http://localhost:5000/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: 'error', message: 'Backend health check failed', details: response.statusText },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ 
      status: 'connected',
      backend: data,
      message: 'Frontend successfully connected to backend on port 5000'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Cannot connect to backend',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
