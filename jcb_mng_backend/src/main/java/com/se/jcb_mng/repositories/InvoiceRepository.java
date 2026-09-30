package com.se.jcb_mng.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.se.jcb_mng.entities.Invoice;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
	List<Invoice> findAllByOrderByIssueDateDesc();
	List<Invoice> findByCustomerUsernameOrderByIssueDateDesc(String customerUsername);
	Optional<Invoice> findByBookingId(Long bookingId);
	boolean existsByBookingId(Long bookingId);
}
