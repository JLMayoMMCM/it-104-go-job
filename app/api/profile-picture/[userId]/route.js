import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get profile picture from account table (BYTEA field)
    const { data: accountData, error } = await supabase
      .from('account')
      .select('account_profile_photo')
      .eq('account_id', userId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Profile picture not found' }, { status: 404 });
    }

    if (!accountData?.account_profile_photo) {
      return NextResponse.json({ error: 'Profile picture not found' }, { status: 404 });
    }

    // Convert BYTEA to Buffer
    let imageBuffer;
    if (typeof accountData.account_profile_photo === 'string') {
      // If it's a hex string (common with BYTEA), convert to buffer
      if (accountData.account_profile_photo.startsWith('\\x')) {
        // Remove \x prefix and convert hex to buffer
        const hexString = accountData.account_profile_photo.slice(2);
        imageBuffer = Buffer.from(hexString, 'hex');
      } else {
        // Try base64 decode
        imageBuffer = Buffer.from(accountData.account_profile_photo, 'base64');
      }
    } else if (Buffer.isBuffer(accountData.account_profile_photo)) {
      imageBuffer = accountData.account_profile_photo;
    } else if (accountData.account_profile_photo instanceof Uint8Array) {
      imageBuffer = Buffer.from(accountData.account_profile_photo);
    } else {
      return NextResponse.json({ error: 'Invalid profile picture format' }, { status: 400 });
    }

    // Detect content type from image buffer
    let contentType = 'image/jpeg'; // default
    
    // Check for common image signatures
    if (imageBuffer.length >= 4) {
      const header = imageBuffer.subarray(0, 4);
      if (header[0] === 0xFF && header[1] === 0xD8) {
        contentType = 'image/jpeg';
      } else if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
        contentType = 'image/png';
      } else if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
        contentType = 'image/gif';
      } else if (header.toString('ascii', 0, 4) === 'RIFF') {
        contentType = 'image/webp';
      }
    }
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': imageBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error reading profile picture:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
      });
    } catch (fileError) {
      console.error('Error reading profile picture file:', fileError);
      return NextResponse.json({ error: 'Profile picture file not found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Error serving profile picture:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
