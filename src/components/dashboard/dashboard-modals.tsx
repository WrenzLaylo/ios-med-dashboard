import { Edit, Trash2 } from 'lucide-react';
import { GlassDialog, GlassDialogContent, GlassDialogHeader, GlassDialogTitle, GlassDialogDescription, GlassDialogFooter } from "@/components/ui/glass-dialog";
import { GlassRippleButton } from "@/components/glass-ripple";
import { GlassInput } from "@/components/ui/glass-input";
import { RESOURCES, FIELD_TYPES, ResourceKey } from '@/app/dashboard/config';

interface ModalsProps {
  activeTab: ResourceKey;
  selectedRow: any;
  isDetailOpen: boolean;
  setIsDetailOpen: (open: boolean) => void;
  isAddOpen: boolean;
  setIsAddOpen: (open: boolean) => void;
  isEditOpen: boolean;
  setIsEditOpen: (open: boolean) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (open: boolean) => void;
  addFormData: any;
  setAddFormData: (data: any) => void;
  editFormData: any;
  setEditFormData: (data: any) => void;
  patientList: any[];
  handleSave: () => void;
  handleDelete: () => void;
  openEdit: (row: any) => void;
}

export function DashboardModals({ 
  activeTab, selectedRow, isDetailOpen, setIsDetailOpen, isAddOpen, setIsAddOpen,
  isEditOpen, setIsEditOpen, showDeleteConfirm, setShowDeleteConfirm,
  addFormData, setAddFormData, editFormData, setEditFormData, patientList,
  handleSave, handleDelete, openEdit
}: ModalsProps) {

  return (
    <>
      {/* Detail Modal */}
      <GlassDialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <GlassDialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
          <GlassDialogHeader>
            <GlassDialogTitle>{RESOURCES[activeTab].label} Details</GlassDialogTitle>
            <GlassDialogDescription>View and manage record information</GlassDialogDescription>
          </GlassDialogHeader>
          <div className="flex-1 overflow-y-auto p-4 glass-scrollbar min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedRow && Object.entries(selectedRow).map(([key, value]) => (
                <div key={key} className="bg-gray-50 dark:bg-accent/20 p-4 rounded-lg border border-gray-200 dark:border-border">
                  <label className="text-xs font-bold text-gray-600 dark:text-muted-foreground uppercase block mb-2">{key.replace(/_/g, ' ')}</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-foreground break-words">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>
          <GlassDialogFooter className="mt-4 gap-2">
             <GlassRippleButton className="bg-red-500/80 text-white" onClick={() => { setIsDetailOpen(false); setShowDeleteConfirm(true); }}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </GlassRippleButton>
            <GlassRippleButton onClick={() => openEdit(selectedRow)}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </GlassRippleButton>
          </GlassDialogFooter>
        </GlassDialogContent>
      </GlassDialog>

      {/* Add/Edit Modal */}
      <GlassDialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); setIsEditOpen(false); } }}>
        <GlassDialogContent className="max-w-xl max-h-[90vh] flex flex-col">
          <GlassDialogHeader>
            <GlassDialogTitle>{isAddOpen ? 'Create New' : 'Edit'} {RESOURCES[activeTab].label}</GlassDialogTitle>
          </GlassDialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 py-4 glass-scrollbar max-h-[calc(90vh-180px)]">
            <div className="space-y-4">
              {Object.entries(isAddOpen ? addFormData : editFormData).map(([key, value]) => {
                const fieldType = FIELD_TYPES[key] || { type: 'text' };
                if (key === 'name' && !isAddOpen) return null;
                const updateState = (e: any) => {
                  const newData = isAddOpen ? { ...addFormData } : { ...editFormData };
                  newData[key] = e.target.value;
                  isAddOpen ? setAddFormData(newData) : setEditFormData(newData);
                };
                return (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-medium capitalize text-foreground">{key.replace(/_/g, ' ')}</label>
                    {fieldType.type === 'textarea' ? (
                      <textarea className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background" value={String(value)} onChange={updateState} placeholder={fieldType.placeholder} />
                    ) : (fieldType.type === 'select' || (key === 'patient' && activeTab === 'Patient Appointment')) ? (
                      <select className="w-full h-10 px-3 rounded-md border border-input bg-background" value={String(value)} onChange={updateState}>
                        <option value="">Select...</option>
                        {key === 'patient' ? patientList.map(p => <option key={p.name} value={p.name}>{p.patient_name}</option>) : fieldType.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : <GlassInput type={fieldType.type} value={String(value)} onChange={updateState} placeholder={fieldType.placeholder} />}
                  </div>
                )
              })}
            </div>
          </div>
          <GlassDialogFooter className="mt-4 pt-4 border-t border-border/50">
            <GlassRippleButton variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Cancel</GlassRippleButton>
            <GlassRippleButton onClick={handleSave}>Save Changes</GlassRippleButton>
          </GlassDialogFooter>
        </GlassDialogContent>
      </GlassDialog>

      {/* Delete Confirmation */}
      <GlassDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <GlassDialogContent className="max-w-md">
          <GlassDialogHeader>
            <GlassDialogTitle>Confirm Deletion</GlassDialogTitle>
            <GlassDialogDescription>Are you sure you want to delete this record?</GlassDialogDescription>
          </GlassDialogHeader>
          <GlassDialogFooter className="gap-2">
            <GlassRippleButton variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</GlassRippleButton>
            <GlassRippleButton className="bg-red-500/80 text-white" onClick={handleDelete}>Delete</GlassRippleButton>
          </GlassDialogFooter>
        </GlassDialogContent>
      </GlassDialog>
    </>
  );
}