'use client';

import React from 'react';
import { GraduationCap, Award, Plus, Trash2, Calendar, BookOpen } from 'lucide-react';
import { EducationItem, CertificationItem } from '@/types/masterCv';

interface EducationEditorProps {
  education: EducationItem[];
  certifications: CertificationItem[];
  onChangeEducation: (updated: EducationItem[]) => void;
  onChangeCertifications: (updated: CertificationItem[]) => void;
}

export const EducationEditor: React.FC<EducationEditorProps> = ({
  education,
  certifications,
  onChangeEducation,
  onChangeCertifications,
}) => {
  const handleUpdateEdu = (id: string, updates: Partial<EducationItem>) => {
    onChangeEducation(
      education.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleAddEdu = () => {
    const newItem: EducationItem = {
      id: `edu_${Date.now()}`,
      institution: 'University Name',
      degree: "Bachelor's Degree",
      field: 'Computer Science',
      startDate: '2020',
      endDate: '2023',
      gpa: '',
      achievements: [],
    };
    onChangeEducation([...education, newItem]);
  };

  const handleRemoveEdu = (id: string) => {
    onChangeEducation(education.filter((item) => item.id !== id));
  };

  const handleUpdateCert = (id: string, updates: Partial<CertificationItem>) => {
    onChangeCertifications(
      certifications.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleAddCert = () => {
    const newCert: CertificationItem = {
      id: `cert_${Date.now()}`,
      name: 'Professional Certificate Name',
      issuer: 'Issuing Organization',
      date: '2024',
    };
    onChangeCertifications([...certifications, newCert]);
  };

  const handleRemoveCert = (id: string) => {
    onChangeCertifications(certifications.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Education Card */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Education & Academic Background</h3>
              <p className="text-xs text-zinc-400">
                Degrees, universities, dates, and relevant software coursework
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddEdu}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Degree
          </button>
        </div>

        <div className="space-y-4">
          {education.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Degree / Qualification
                    </label>
                    <input
                      type="text"
                      value={item.degree}
                      onChange={(e) =>
                        handleUpdateEdu(item.id, { degree: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Institution / University
                    </label>
                    <input
                      type="text"
                      value={item.institution}
                      onChange={(e) =>
                        handleUpdateEdu(item.id, { institution: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveEdu(item.id)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Major / Field of Study
                  </label>
                  <input
                    type="text"
                    value={item.field || ''}
                    onChange={(e) =>
                      handleUpdateEdu(item.id, { field: e.target.value })
                    }
                    placeholder="e.g. Computer Science"
                    className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Dates Attended
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={item.startDate}
                      onChange={(e) =>
                        handleUpdateEdu(item.id, { startDate: e.target.value })
                      }
                      placeholder="Start (2020)"
                      className="w-1/2 px-2.5 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200"
                    />
                    <input
                      type="text"
                      value={item.endDate}
                      onChange={(e) =>
                        handleUpdateEdu(item.id, { endDate: e.target.value })
                      }
                      placeholder="End (2023)"
                      className="w-1/2 px-2.5 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    GPA / Honors
                  </label>
                  <input
                    type="text"
                    value={item.gpa || ''}
                    onChange={(e) =>
                      handleUpdateEdu(item.id, { gpa: e.target.value })
                    }
                    placeholder="e.g. 3.9 / 4.0 or Honors"
                    className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications Card */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Certifications & Licenses</h3>
              <p className="text-xs text-zinc-400">
                Industry certifications, verified badges, and licenses
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddCert}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Certification
          </button>
        </div>

        <div className="space-y-3">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                <input
                  type="text"
                  value={cert.name}
                  onChange={(e) => handleUpdateCert(cert.id, { name: e.target.value })}
                  placeholder="Certification Name"
                  className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 border border-zinc-800 rounded-lg text-white"
                />
                <input
                  type="text"
                  value={cert.issuer}
                  onChange={(e) =>
                    handleUpdateCert(cert.id, { issuer: e.target.value })
                  }
                  placeholder="Issuer (e.g. AWS, Meta)"
                  className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200"
                />
                <input
                  type="text"
                  value={cert.date}
                  onChange={(e) => handleUpdateCert(cert.id, { date: e.target.value })}
                  placeholder="Year / Date"
                  className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRemoveCert(cert.id)}
                className="p-1 rounded text-zinc-500 hover:text-rose-400 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {certifications.length === 0 && (
            <div className="text-center py-6 text-xs text-zinc-500">
              No certifications added yet. Click &quot;Add Certification&quot; above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
