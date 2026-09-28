# Class inventory

kernel: BoardId, CardId, ActorId, SequenceNumber, Clock
boards: Board, BoardColumn, Card, CreateBoardUseCase, AddColumnUseCase, AddCardUseCase, MoveCardUseCase, RenameCardUseCase
presence: PresenceSnapshot, JoinBoardUseCase, LeaveBoardUseCase, HeartbeatPresenceUseCase
sync: BoardOperation, OperationLog, ApplyOperationUseCase, ReplayFromSequenceUseCase, ConflictResolver
access: BoardMembership, ShareLink, GrantBoardAccessUseCase
history: CardHistoryEntry, RecordCardChangeUseCase
ports: BoardStore, OperationLogStore, PresenceStore, RealtimePublisher
