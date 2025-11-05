'use client';

export function Header() {
  return (
    <header className="bg-netapp-blue text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">🔷 NetApp RAG System</h1>
            <span className="ml-4 text-sm opacity-75">Permission-aware with FSx ONTAP</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Lambda v2.2.0</span>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
