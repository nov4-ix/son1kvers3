import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const trackId = req.nextUrl.searchParams.get('trackId')
  
  if (!trackId) {
    return NextResponse.json({ error: 'trackId requerido' }, { status: 400 })
  }
  
  const SUNO_TOKEN = process.env.SUNO_COOKIE
  
  console.log('🔍 DIAGNÓSTICO SUNO')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎯 TrackId:', trackId)
  console.log('🔑 Token:', SUNO_TOKEN?.substring(0, 20) + '...')
  
  // Probar diferentes endpoints
  const endpoints = [
    {
      name: 'usa.imgkits.com/node-api',
      url: `https://usa.imgkits.com/node-api/suno/get_mj_status/${trackId}`
    },
    {
      name: 'ai.imgkits.com/suno',
      url: `https://ai.imgkits.com/suno/get_mj_status/${trackId}`
    },
    {
      name: 'usa.imgkits.com/node-api (query)',
      url: `https://usa.imgkits.com/node-api/suno/get_mj_status?taskId=${trackId}`
    }
  ]
  
  const results = []
  
  for (const endpoint of endpoints) {
    console.log(`\n📡 Probando: ${endpoint.name}`)
    console.log(`   URL: ${endpoint.url}`)
    
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUNO_TOKEN}`,
          'channel': 'node-api',
          'Content-Type': 'application/json'
        }
      })
      
      console.log(`   Status: ${response.status}`)
      console.log(`   Content-Type: ${response.headers.get('content-type')}`)
      
      const text = await response.text()
      console.log(`   Response length: ${text.length} chars`)
      console.log(`   First 200 chars: ${text.substring(0, 200)}`)
      
      let parsed = null
      try {
        parsed = JSON.parse(text)
      } catch (e) {
        console.log(`   ❌ No es JSON válido`)
      }
      
      results.push({
        endpoint: endpoint.name,
        url: endpoint.url,
        status: response.status,
        contentType: response.headers.get('content-type'),
        isJson: !!parsed,
        responsePreview: text.substring(0, 300),
        parsed: parsed
      })
      
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
      results.push({
        endpoint: endpoint.name,
        url: endpoint.url,
        error: error.message
      })
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  return NextResponse.json({
    trackId,
    timestamp: new Date().toISOString(),
    results
  })
}

export const dynamic = 'force-dynamic'

