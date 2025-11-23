import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/alerts/[id]
 * Update an existing alert
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    // In production, update in database
    console.log('✅ Alert updated:', id);

    return NextResponse.json({
      success: true,
      id,
      updates,
    });
  } catch (error) {
    console.error('❌ Error updating alert:', error);
    return NextResponse.json(
      {
        error: 'Failed to update alert',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alerts/[id]
 * Delete an alert
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // In production, delete from database
    console.log('✅ Alert deleted:', id);

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    console.error('❌ Error deleting alert:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete alert',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
