import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugPage() {
  const [versionInfo, setVersionInfo] = useState<any>(null);
  
  useEffect(() => {
    // Fetch version info from public endpoint
    fetch('/version.json')
      .then(res => {
        console.log('Version fetch response status:', res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Version data loaded:', data);
        setVersionInfo(data);
      })
      .catch(err => {
        console.error('Error fetching version:', err);
        // Fallback version info
        setVersionInfo({
          version: "v2.0.FINAL.24072025",
          error: "Could not fetch version.json - using fallback",
          buildTime: new Date().toISOString()
        });
      });
  }, []);

  const debugInfo = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    environment: import.meta.env.MODE,
    baseUrl: import.meta.env.BASE_URL,
    adminPanelVersion: "v2.0.FINAL.24072025"
  };

  console.log("🔍 DEBUG PAGE LOADED:", debugInfo);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              🚀 DEPLOYMENT DEBUG PANEL v2.0.FINAL.24072025
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="p-4 bg-green-100 rounded-lg">
                <h3 className="font-bold text-green-800">✅ Current Build Info</h3>
                <p>Timestamp: {debugInfo.timestamp}</p>
                <p>Admin Panel Version: {debugInfo.adminPanelVersion}</p>
                <p>Environment: {debugInfo.environment}</p>
              </div>
              
              {versionInfo && (
                <div className="p-4 bg-blue-100 rounded-lg">
                  <h3 className="font-bold text-blue-800">📋 Version File Info</h3>
                  <pre className="text-sm">{JSON.stringify(versionInfo, null, 2)}</pre>
                </div>
              )}
              
              <div className="p-4 bg-yellow-100 rounded-lg">
                <h3 className="font-bold text-yellow-800">🌐 Browser Info</h3>
                <p>URL: {debugInfo.url}</p>
                <p>Base URL: {debugInfo.baseUrl}</p>
                <p>User Agent: {debugInfo.userAgent.substring(0, 100)}...</p>
              </div>
              
              <div className="p-4 bg-purple-100 rounded-lg">
                <h3 className="font-bold text-purple-800">🔧 Expected vs Actual</h3>
                <p><strong>Expected Title:</strong> "Panel de Administración v2.0 - DEPLOYMENT TEST"</p>
                <p><strong>Expected Subtitle:</strong> "actualización 24/07/2025 - DEBUG VERSIÓN"</p>
                <p><strong>If deployment shows old title:</strong> Cache or sync issue detected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}