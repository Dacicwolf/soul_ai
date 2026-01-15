import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-rose-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Termeni de utilizare și confidențialitate
            </h1>
          </div>

          <div className="space-y-6 text-gray-700">
            {/* Section 1 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b-2 border-indigo-200 pb-2">
                1. Despre această aplicație
              </h2>
              <p className="leading-relaxed">
                Această aplicație oferă suport emoțional general și un spațiu de reflecție pentru clarificarea gândurilor și a stărilor emoționale.
              </p>
              <p className="leading-relaxed mt-2">
                Aplicația <span className="font-medium underline decoration-red-400">nu oferă diagnostic medical sau psihologic</span> și <span className="font-medium underline decoration-red-400">nu furnizează tratament de niciun fel</span>.
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b-2 border-indigo-200 pb-2">
                2. Limitări ale serviciului
              </h2>
              <p className="leading-relaxed mb-2">
                Aplicația <span className="font-medium underline decoration-amber-400">nu înlocuiește</span>:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>terapia sau consilierea profesională</li>
                <li>sfaturile medicale sau psihologice</li>
                <li>serviciile de urgență sau intervenție în situații de criză</li>
              </ul>
              <p className="leading-relaxed mt-3">
                Aplicația este concepută ca un companion de suport, <span className="font-medium underline decoration-purple-400">nu ca un serviciu medical sau clinic</span>.
              </p>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b-2 border-indigo-200 pb-2">
                3. Responsabilitatea utilizatorului
              </h2>
              <p className="leading-relaxed">
                Utilizatorul înțelege că folosește aplicația <span className="font-medium underline decoration-blue-400">pe propria răspundere</span>.
              </p>
              <p className="leading-relaxed mt-2">
                Orice decizie personală luată în urma utilizării aplicației aparține exclusiv utilizatorului.
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b-2 border-indigo-200 pb-2">
                4. Confidențialitate
              </h2>
              <p className="leading-relaxed">
                Conversațiile sunt procesate automat pentru a genera răspunsuri.
              </p>
              <p className="leading-relaxed mt-2">
                Aplicația <span className="font-medium underline decoration-orange-400">nu trebuie utilizată pentru a transmite informații extrem de sensibile sau confidențiale</span>.
              </p>
              <p className="leading-relaxed mt-2">
                Dacă aplicația stochează sau nu conversațiile, acest lucru este specificat în documentația tehnică sau în setările aplicației.
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b-2 border-indigo-200 pb-2">
                5. Acceptarea termenilor
              </h2>
              <p className="leading-relaxed">
                Prin utilizarea acestei aplicații, confirmi că ai citit, ai înțeles și accepți acești Termeni de utilizare și confidențialitate.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}