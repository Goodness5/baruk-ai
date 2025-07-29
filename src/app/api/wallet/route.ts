import { NextRequest, NextResponse } from 'next/server';
import { contextManager } from '../../lib/contextManager';

export async function POST(request: NextRequest) {
  try {
    const { action, userId, address, type } = await request.json();

    if (!action || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    switch (action) {
      case 'connect':
        if (!address || !type) {
          return NextResponse.json({ error: "Missing address or type" }, { status: 400 });
        }
        
        const success = await contextManager.connectWallet(userId, address, type);
        return NextResponse.json({ 
          success, 
          message: 'Wallet connected successfully',
          session: contextManager.getUserSession(userId)
        });

      case 'disconnect':
        contextManager.disconnectWallet(userId);
        return NextResponse.json({ 
          success: true, 
          message: 'Wallet disconnected successfully' 
        });

      case 'status':
        const session = contextManager.getUserSession(userId);
        return NextResponse.json({ 
          success: true, 
          session 
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Wallet API Error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 