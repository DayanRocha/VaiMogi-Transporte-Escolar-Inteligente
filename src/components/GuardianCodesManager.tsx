import { useState } from 'react';
import { ArrowLeft, Key, Copy, RefreshCw, Check } from 'lucide-react';
import { Guardian } from '@/types/driver';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface GuardianCodesManagerProps {
    guardians: Guardian[];
    onBack: () => void;
    onUpdateGuardian: (guardianId: string, data: Partial<Guardian>) => void;
}

export const GuardianCodesManager = ({
    guardians,
    onBack,
    onUpdateGuardian
}: GuardianCodesManagerProps) => {
    const [selectedGuardianId, setSelectedGuardianId] = useState<string>('');
    const [copiedCode, setCopiedCode] = useState<string>('');

    const generateUniqueCode = (): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleGenerateCode = () => {
        if (!selectedGuardianId) {
            toast.error('Selecione um responsável primeiro');
            return;
        }

        const newCode = generateUniqueCode();
        const currentDate = new Date().toISOString();

        onUpdateGuardian(selectedGuardianId, {
            uniqueCode: newCode,
            codeGeneratedAt: currentDate
        });

        toast.success('Código único gerado com sucesso!');
    };

    const handleCopyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            toast.success('Código copiado para a área de transferência!');

            setTimeout(() => {
                setCopiedCode('');
            }, 2000);
        } catch (err) {
            toast.error('Erro ao copiar código');
        }
    };

    const selectedGuardian = guardians.find(g => g.id === selectedGuardianId);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b p-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Key className="w-6 h-6 text-orange-500" />
                        <h1 className="text-xl font-semibold text-gray-800">Códigos Únicos</h1>
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-md mx-auto space-y-6">
                {/* Seleção de Responsável */}
                <Card className="p-4">
                    <h2 className="text-lg font-medium text-gray-800 mb-4">Selecionar Responsável</h2>

                    <Select value={selectedGuardianId} onValueChange={setSelectedGuardianId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Escolha um responsável..." />
                        </SelectTrigger>
                        <SelectContent>
                            {guardians.map((guardian) => (
                                <SelectItem key={guardian.id} value={guardian.id}>
                                    {guardian.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Card>

                {/* Geração de Código */}
                <Card className="p-4">
                    <h2 className="text-lg font-medium text-gray-800 mb-4">Gerar Código Único</h2>

                    <Button
                        onClick={handleGenerateCode}
                        disabled={!selectedGuardianId}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Gerar Novo Código
                    </Button>
                </Card>

                {/* Código Atual */}
                {selectedGuardian && selectedGuardian.uniqueCode && (
                    <Card className="p-4 border-2 border-orange-200">
                        <h2 className="text-lg font-medium text-gray-800 mb-4">Código Gerado</h2>

                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 text-center">
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-1">Responsável:</p>
                                <p className="font-semibold text-gray-800 text-lg">{selectedGuardian.name}</p>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">Código Único:</p>
                                <div
                                    className="bg-white rounded-lg p-4 border-2 border-orange-300 cursor-pointer hover:bg-orange-50 transition-colors"
                                    onClick={() => handleCopyCode(selectedGuardian.uniqueCode!)}
                                >
                                    <code className="text-2xl font-mono font-bold text-orange-600 tracking-wider">
                                        {selectedGuardian.uniqueCode}
                                    </code>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        {copiedCode === selectedGuardian.uniqueCode ? (
                                            <>
                                                <Check className="w-4 h-4 text-green-600" />
                                                <span className="text-sm text-green-600 font-medium">Copiado!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm text-gray-500">Clique para copiar</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {selectedGuardian.codeGeneratedAt && (
                                <p className="text-xs text-gray-500">
                                    Gerado em: {new Date(selectedGuardian.codeGeneratedAt).toLocaleString('pt-BR')}
                                </p>
                            )}
                        </div>
                    </Card>
                )}

                {/* Lista de Todos os Códigos */}
                {guardians.some(g => g.uniqueCode) && (
                    <Card className="p-4">
                        <h2 className="text-lg font-medium text-gray-800 mb-4">Todos os Códigos</h2>

                        <div className="space-y-3">
                            {guardians
                                .filter(guardian => guardian.uniqueCode)
                                .map((guardian) => (
                                    <div
                                        key={guardian.id}
                                        className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleCopyCode(guardian.uniqueCode!)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800 text-sm mb-2">{guardian.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="bg-white px-3 py-2 rounded border text-lg font-mono font-bold text-orange-600 flex-1">
                                                        {guardian.uniqueCode}
                                                    </code>
                                                    <div className="flex items-center gap-1">
                                                        {copiedCode === guardian.uniqueCode ? (
                                                            <>
                                                                <Check className="w-4 h-4 text-green-600" />
                                                                <span className="text-xs text-green-600 font-medium">Copiado!</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-4 h-4 text-gray-500" />
                                                                <span className="text-xs text-gray-500">Copiar</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </Card>
                )}

                {guardians.length === 0 && (
                    <Card className="p-6 text-center">
                        <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 mb-2">Nenhum responsável cadastrado</p>
                        <p className="text-sm text-gray-400">
                            Cadastre responsáveis primeiro para gerar códigos únicos
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
};