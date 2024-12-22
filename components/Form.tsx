'use client';

import { useState } from "react";
import { FileText, Upload, X, CheckCircle, Loader2 } from "lucide-react";
import Image from 'next/image';


// Simple Alert Component
const Alert: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`p-4 rounded-lg border ${className}`}>
    {children}
  </div>
);

// Form Data Interface
interface FormData {
  insuredName: string;
  insuranceCompany: string;
  county: string;
  policyNumber: string;
  address: string;
  dateOfLoss: string;
  claimNumber: string;
  aobContract: File | null;
  damagePicture: File | null;
  denial: File | null;
  hoverReport1: File | null;
  itelReport: File | null;
  insuranceEstimate: File | null;
  hisHersEstimate: File | null;
  correspondent: File | null;
}

// File Upload Field Props Interface
interface FileUploadFieldProps {
  name: keyof FormData;
  label: string;
  required?: boolean;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export default function Form() {
  const [formData, setFormData] = useState<FormData>({
    insuredName: "",
    insuranceCompany: "",
    county: "",
    policyNumber: "",
    address: "",
    dateOfLoss: "",
    claimNumber: "",
    aobContract: null,
    damagePicture: null,
    denial: null,
    hoverReport1: null,
    itelReport: null,
    insuranceEstimate: null,
    hisHersEstimate: null,
    correspondent: null,
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files?.[0] || null : value
    }));
  };

// Update the handleSubmit function in your Form component:
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    const formDataToSend = new FormData();
    
    // Log the entire formData object
    console.log('Full form data:', formData);
    
    // Append all text fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value instanceof File) {
        console.log(`Appending file ${key} - Name: ${value.name}, Size: ${value.size}, Type: ${value.type}`);
        // Remove the files. prefix for the API
        const fileKey = key;
        formDataToSend.append(fileKey, value);
      } else if (value !== null && typeof value === 'string') {
        console.log(`Appending field ${key}:`, value);
        formDataToSend.append(key, value);
      }
    });

    // Log all FormData entries before sending
    for (const pair of formDataToSend.entries()) {
      console.log('FormData entry:', pair[0], pair[1]);
    }
    

    console.log('Submitting form data to API...');
    
    const response = await fetch('/api/county', {
      method: 'POST',
      body: formDataToSend,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message}`);
    }

    const result = await response.json();
    console.log('Submission result:', result);
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('There was an error submitting the form. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  const handleCountyKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      console.log('Enter key pressed, initiating request with county:', formData.county);
  
      try {
        const response = await fetch('/api/county', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ county: formData.county }),
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          console.error('API Error:', response.status, result.message);
          alert(`Error: ${result.message}`);
          return;
        }
  
        console.log('API Response:', result);
        alert('County data sent successfully!');
      } catch (error) {
        console.error('Unexpected error:', error);
        alert('An unexpected error occurred.');
      }
    }
  };

  const FileUploadField: React.FC<FileUploadFieldProps> = ({ 
    name, 
    label, 
    required = false,
    formData,
    setFormData
  }) => {
    const file = formData[name] as File | null;
    
    const handleRemoveFile = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        [name]: null
      }));
    };

    return (
      <div className="relative">
        <label htmlFor={name} className="block text-lg font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
          {!required && <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>}
        </label>
        <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${file ? 'border-blue-900 bg-blue-50' : 'border-gray-300 border-dashed'} rounded-lg transition-all duration-200 ${!file && 'hover:border-blue-400'}`}>
          {!file ? (
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label htmlFor={name} className="relative cursor-pointer rounded-md font-medium text-blue-900 hover:text-blue-500">
                  <span>Upload a file</span>
                  <input
                    id={name}
                    name={name}
                    type="file"
                    className="sr-only"
                    onChange={handleChange}
                    required={required}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-900" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-1 hover:bg-blue-900 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-12 relative">
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <Alert className="bg-green-50 border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <h3 className="font-medium text-black">Success!</h3>
                <p className="text-sm text-gray-600">
                  Your complaint form has been submitted successfully.
                </p>
              </div>
            </div>
          </Alert>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-7xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-200"
      >
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-900" />
            <h1 className="text-3xl font-bold text-gray-900">
              Complaint Form
            </h1>
          </div>
          <p className="mt-2 text-gray-600">
            Please fill in all required information for the AOB complaint
          </p>
        </div>

        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Text Inputs */}
            <div>
              <label htmlFor="insuredName" className="block text-lg font-medium text-gray-700 mb-2">
                Insured&#39;s Name
              </label>
              <input
                type="text"
                name="insuredName"
                id="insuredName"
                value={formData.insuredName}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                required
              />
            </div>

            <div>
              <label htmlFor="insuranceCompany" className="block text-lg font-medium text-gray-700 mb-2">
                Insurance Company
              </label>
              <input
                type="text"
                name="insuranceCompany"
                id="insuranceCompany"
                value={formData.insuranceCompany}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                required
              />
            </div>

            <div>
              <label htmlFor="county" className="block text-lg font-medium text-gray-700 mb-2">
                County
              </label>
              <input
                type="text"
                name="county"
                id="county"
                value={formData.county}
                onChange={handleChange}
                onKeyDown={handleCountyKeyPress}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                required
              />
            </div>

            <div>
              <label htmlFor="policyNumber" className="block text-lg font-medium text-gray-700 mb-2">
                Policy Number
              </label>
              <input
                type="text"
                name="policyNumber"
                id="policyNumber"
                value={formData.policyNumber}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                required
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-lg font-medium text-gray-700 mb-2">
                Address of Insured
              </label>
              <input
                type="text"
                name="address"
                id="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                required
              />
            </div>

            <div>
              <label htmlFor="dateOfLoss" className="block text-lg font-medium text-gray-700 mb-2">
                Date of Loss
              </label>
              <input
                type="date"
                name="dateOfLoss"
                id="dateOfLoss"
                value={formData.dateOfLoss}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                required
              />
            </div>

            <div>
              <label htmlFor="claimNumber" className="block text-lg font-medium text-gray-700 mb-2">
                Claim Number
              </label>
              <input
                type="text"
                name="claimNumber"
                id="claimNumber"
                value={formData.claimNumber}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                required
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="mt-10 space-y-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FileUploadField 
                name="aobContract" 
                label="AOB Contract" 
                required={true}
                formData={formData}
                setFormData={setFormData}
              />
              <FileUploadField 
                name="damagePicture" 
                label="Picture of Damage"
                formData={formData}
                setFormData={setFormData}
              />
              <FileUploadField 
                name="denial" 
                label="Denial Document"
                formData={formData}
                setFormData={setFormData}
              />
              <FileUploadField 
                name="hoverReport1" 
                label="Hover Report"
                formData={formData}
                setFormData={setFormData}
              />
              <FileUploadField 
                name="itelReport" 
                label="ITEL Report"
                formData={formData}
                setFormData={setFormData}
              />
              <FileUploadField 
                name="insuranceEstimate" 
                label="Insurance Estimate"
                formData={formData}
                setFormData={setFormData}
              />
              <FileUploadField 
                name="hisHersEstimate" 
                label="His & Hers Estimate"
                formData={formData}
                setFormData={setFormData}
              />
              <FileUploadField 
                name="correspondent" 
                label="Correspondent"
                formData={formData}
                setFormData={setFormData}
              />
            </div>
          </div>

          <div className="mt-10 flex items-center justify-end space-x-4">
      
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-900 transition-colors flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Form</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}